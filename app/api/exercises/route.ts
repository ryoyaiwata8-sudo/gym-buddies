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

    // Fetch exercises
    const exercises = await prisma.exercise.findMany({
      where: bodyPart ? { bodyPart } : undefined,
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
