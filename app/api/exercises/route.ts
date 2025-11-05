import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bodyPart = searchParams.get('bodyPart')

    // Fetch exercises (preset + user's custom)
    const exercises = await prisma.exercise.findMany({
      where: {
        AND: [
          bodyPart ? { bodyPart } : {},
          {
            OR: [
              { isCustom: false }, // Preset exercises
              { userId: session.user.id }, // User's custom exercises
            ],
          },
        ],
      },
      orderBy: { name: 'asc' },
    })

    // For each exercise, find the last workout date
    const exercisesWithLastDate = await Promise.all(
      exercises.map(async (exercise) => {
        const lastWorkout = await prisma.workout.findFirst({
          where: {
            userId: session.user.id,
            sets: {
              some: {
                exerciseId: exercise.id,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          id: exercise.id,
          name: exercise.name,
          bodyPart: exercise.bodyPart,
          lastWorkoutDate: lastWorkout
            ? format(new Date(lastWorkout.date), 'M月d日', { locale: ja })
            : undefined,
        }
      })
    )

    return NextResponse.json({ exercises: exercisesWithLastDate })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// Create custom exercise
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { name, bodyPart } = await request.json()

    if (!name || !bodyPart) {
      return NextResponse.json(
        { error: '種目名と部位は必須です' },
        { status: 400 }
      )
    }

    // Trim whitespace
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: '種目名を入力してください' },
        { status: 400 }
      )
    }

    // Check if exercise with same name already exists for this user
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: trimmedName,
        OR: [
          { isCustom: false }, // Check preset exercises
          { userId: session.user.id }, // Check user's custom exercises
        ],
      },
    })

    if (existingExercise) {
      return NextResponse.json(
        { error: 'この名前の種目は既に存在します' },
        { status: 400 }
      )
    }

    // Create custom exercise
    const exercise = await prisma.exercise.create({
      data: {
        name: trimmedName,
        bodyPart,
        userId: session.user.id,
        isCustom: true,
      },
    })

    return NextResponse.json({
      message: 'カスタム種目を作成しました',
      exercise: {
        id: exercise.id,
        name: exercise.name,
        bodyPart: exercise.bodyPart,
      }
    })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: '種目の作成に失敗しました' },
      { status: 500 }
    )
  }
}
