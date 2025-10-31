import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Create date range for the specified month
    const targetDate = new Date(year, month - 1, 1)
    const start = startOfMonth(targetDate)
    const end = endOfMonth(targetDate)

    // Fetch all workouts for the month
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Group workouts by date and calculate daily stats
    const dailyStats = workouts.reduce((acc, workout) => {
      const dateKey = workout.date.toISOString().split('T')[0]

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          workoutCount: 0,
          totalSets: 0,
          totalVolume: 0,
          exercises: new Set(),
        }
      }

      acc[dateKey].workoutCount += 1
      acc[dateKey].totalSets += workout.sets.length
      acc[dateKey].totalVolume += workout.sets.reduce(
        (sum, set) => sum + set.weightKg * set.reps,
        0
      )
      workout.sets.forEach(set => {
        acc[dateKey].exercises.add(set.exercise.name)
      })

      return acc
    }, {} as Record<string, {
      date: string
      workoutCount: number
      totalSets: number
      totalVolume: number
      exercises: Set<string>
    }>)

    // Convert Set to Array for JSON serialization
    const result = Object.values(dailyStats).map(stat => ({
      ...stat,
      exercises: Array.from(stat.exercises),
      exerciseCount: stat.exercises.size,
    }))

    return NextResponse.json({
      year,
      month,
      days: result,
    })
  } catch (error) {
    console.error('Error fetching calendar data:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
