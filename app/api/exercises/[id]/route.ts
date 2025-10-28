import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const exerciseId = params.id

    // Fetch exercise
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    })

    if (!exercise) {
      return NextResponse.json({ error: '種目が見つかりません' }, { status: 404 })
    }

    // Fetch last workout with this exercise
    const lastWorkout = await prisma.workout.findFirst({
      where: {
        userId: session.user.id,
        sets: {
          some: {
            exerciseId,
          },
        },
      },
      include: {
        sets: {
          where: {
            exerciseId,
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
      exercise,
      lastSets,
    })
  } catch (error) {
    console.error('Error fetching exercise:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
