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
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ error: '種目名が必要です' }, { status: 400 })
    }

    // Find exercise by name
    const exercise = await prisma.exercise.findFirst({
      where: { name },
    })

    if (!exercise) {
      return NextResponse.json({ error: '種目が見つかりません' }, { status: 404 })
    }

    // Find last workout with this exercise
    const lastWorkout = await prisma.workout.findFirst({
      where: {
        userId: session.user.id,
        sets: {
          some: {
            exerciseId: exercise.id,
          },
        },
      },
      include: {
        sets: {
          where: {
            exerciseId: exercise.id,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    const lastSets = lastWorkout
      ? lastWorkout.sets.map((set) => ({
          weightKg: set.weightKg,
          reps: set.reps,
          rpe: set.rpe,
          date: format(new Date(lastWorkout.date), 'M月d日', { locale: ja }),
        }))
      : []

    return NextResponse.json({
      exercise: {
        id: exercise.id,
        name: exercise.name,
        bodyPart: exercise.bodyPart,
      },
      lastSets,
    })
  } catch (error) {
    console.error('Error fetching exercise by name:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
