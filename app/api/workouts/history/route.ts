import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // all, week, month, 3months

    // Calculate date range based on period
    let startDate: Date | undefined
    const today = new Date()

    switch (period) {
      case 'week':
        startDate = subDays(today, 7)
        break
      case 'month':
        startDate = subDays(today, 30)
        break
      case '3months':
        startDate = subDays(today, 90)
        break
      case 'all':
      default:
        startDate = undefined
        break
    }

    // Fetch workouts with sets and exercises
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        ...(startDate && { date: { gte: startDate } }),
      },
      include: {
        sets: {
          include: {
            exercise: true,
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

    // Format the response
    const formattedWorkouts = workouts.map((workout) => {
      const exercises = new Map<string, { name: string; bodyPart: string; sets: any[] }>()

      // Group sets by exercise
      workout.sets.forEach((set) => {
        const exerciseId = set.exercise.id
        if (!exercises.has(exerciseId)) {
          exercises.set(exerciseId, {
            name: set.exercise.name,
            bodyPart: set.exercise.bodyPart,
            sets: [],
          })
        }
        exercises.get(exerciseId)!.sets.push({
          id: set.id,
          weightKg: set.weightKg,
          reps: set.reps,
          rpe: set.rpe,
          prType: set.prType,
        })
      })

      const totalVolume = workout.sets.reduce(
        (sum, set) => sum + set.weightKg * set.reps,
        0
      )

      return {
        id: workout.id,
        date: workout.date.toISOString(),
        note: workout.note,
        totalSets: workout.sets.length,
        totalVolume,
        exerciseCount: exercises.size,
        exercises: Array.from(exercises.values()),
      }
    })

    return NextResponse.json({ workouts: formattedWorkouts })
  } catch (error) {
    console.error('Error fetching workout history:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
