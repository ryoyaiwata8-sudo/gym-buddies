import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, format, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days' // 7days, 30days, 90days, all
    const groupBy = searchParams.get('groupBy') || 'day' // day, week

    // Calculate date range
    let startDate: Date
    const endDate = new Date()

    switch (period) {
      case '7days':
        startDate = subDays(endDate, 7)
        break
      case '30days':
        startDate = subDays(endDate, 30)
        break
      case '90days':
        startDate = subDays(endDate, 90)
        break
      case 'all':
      default:
        // Get the date of the first workout
        const firstWorkout = await prisma.workout.findFirst({
          where: { userId: session.user.id },
          orderBy: { date: 'asc' },
        })
        startDate = firstWorkout ? startOfDay(firstWorkout.date) : subDays(endDate, 30)
        break
    }

    // Fetch all workouts in the period
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
      orderBy: {
        date: 'asc',
      },
    })

    // 1. Volume over time
    const volumeData: { date: string; volume: number; workouts: number }[] = []

    if (groupBy === 'day') {
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      const dailyStats = new Map<string, { volume: number; workouts: number }>()

      workouts.forEach((workout) => {
        const dateKey = format(workout.date, 'yyyy-MM-dd')
        const volume = workout.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0)

        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, { volume: 0, workouts: 0 })
        }

        const stats = dailyStats.get(dateKey)!
        stats.volume += volume
        stats.workouts += 1
      })

      days.forEach((day) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const stats = dailyStats.get(dateKey) || { volume: 0, workouts: 0 }
        volumeData.push({
          date: dateKey,
          volume: Math.round(stats.volume),
          workouts: stats.workouts,
        })
      })
    } else {
      // Group by week
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 } // Monday
      )

      const weeklyStats = new Map<string, { volume: number; workouts: number }>()

      workouts.forEach((workout) => {
        const weekStart = startOfWeek(workout.date, { weekStartsOn: 1 })
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        const volume = workout.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0)

        if (!weeklyStats.has(weekKey)) {
          weeklyStats.set(weekKey, { volume: 0, workouts: 0 })
        }

        const stats = weeklyStats.get(weekKey)!
        stats.volume += volume
        stats.workouts += 1
      })

      weeks.forEach((week) => {
        const weekKey = format(week, 'yyyy-MM-dd')
        const stats = weeklyStats.get(weekKey) || { volume: 0, workouts: 0 }
        volumeData.push({
          date: weekKey,
          volume: Math.round(stats.volume),
          workouts: stats.workouts,
        })
      })
    }

    // 2. Body part distribution
    const bodyPartVolume = new Map<string, number>()

    workouts.forEach((workout) => {
      workout.sets.forEach((set) => {
        const bodyPart = set.exercise.bodyPart
        const volume = set.weightKg * set.reps
        bodyPartVolume.set(bodyPart, (bodyPartVolume.get(bodyPart) || 0) + volume)
      })
    })

    const bodyPartData = Array.from(bodyPartVolume.entries()).map(([bodyPart, volume]) => ({
      bodyPart,
      volume: Math.round(volume),
    })).sort((a, b) => b.volume - a.volume)

    // 3. Summary statistics
    const totalWorkouts = workouts.length
    const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0)
    const totalVolume = workouts.reduce(
      (sum, w) => sum + w.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
      0
    )
    const uniqueExercises = new Set(workouts.flatMap((w) => w.sets.map((s) => s.exercise.id)))

    // Calculate average per workout
    const avgSetsPerWorkout = totalWorkouts > 0 ? Math.round(totalSets / totalWorkouts) : 0
    const avgVolumePerWorkout = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalWorkouts,
        totalSets,
        totalVolume: Math.round(totalVolume),
        uniqueExercises: uniqueExercises.size,
        avgSetsPerWorkout,
        avgVolumePerWorkout,
      },
      volumeOverTime: volumeData,
      bodyPartDistribution: bodyPartData,
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
