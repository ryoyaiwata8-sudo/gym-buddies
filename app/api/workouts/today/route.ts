import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const today = new Date()
    const startDate = startOfDay(today)
    const endDate = endOfDay(today)

    // Fetch today's workouts with sets and exercises
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    })

    // Group sets by exercise
    const exerciseMap = new Map<string, any>()

    for (const workout of workouts) {
      for (const set of workout.sets) {
        const exerciseId = set.exercise.id
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            id: workout.id,
            exercise: set.exercise,
            sets: [],
          })
        }
        exerciseMap.get(exerciseId).sets.push({
          id: set.id,
          weightKg: set.weightKg,
          reps: set.reps,
          rpe: set.rpe,
        })
      }
    }

    const exercises = Array.from(exerciseMap.values())

    // Calculate stats
    const totalExercises = exercises.length
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalReps = exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((s: number, set: any) => s + set.reps, 0),
      0
    )
    const totalLoad = exercises.reduce(
      (sum, ex) =>
        sum + ex.sets.reduce((s: number, set: any) => s + set.weightKg * set.reps, 0),
      0
    )

    // Check if there are any unpublished workouts today
    const hasUnpublished = workouts.some((workout) => !workout.isPublished)

    return NextResponse.json({
      stats: {
        totalExercises,
        totalSets,
        totalReps,
        totalLoad: Math.round(totalLoad),
      },
      exercises,
      hasUnpublished,
    })
  } catch (error) {
    console.error('Error fetching today data:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const today = new Date()
    const startDate = startOfDay(today)
    const endDate = endOfDay(today)

    // Delete all today's workouts
    const result = await prisma.workout.deleteMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    return NextResponse.json({
      message: '今日のワークアウトを削除しました',
      deleted: result.count,
    })
  } catch (error) {
    console.error('Error deleting today workouts:', error)
    return NextResponse.json(
      { error: 'ワークアウトの削除に失敗しました' },
      { status: 500 }
    )
  }
}
