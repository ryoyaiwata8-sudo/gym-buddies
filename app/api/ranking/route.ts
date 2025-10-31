import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    let startDate: Date
    let endDate: Date = new Date()

    if (period === 'week') {
      startDate = startOfWeek(endDate, { weekStartsOn: 1 }) // Monday
      endDate = endOfWeek(endDate, { weekStartsOn: 1 })
    } else {
      // Default to current week
      startDate = startOfWeek(endDate, { weekStartsOn: 1 })
      endDate = endOfWeek(endDate, { weekStartsOn: 1 })
    }

    // Get all workouts in the period
    const workouts = await prisma.workout.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        sets: true,
      },
    })

    // Calculate total load per user
    const userLoads = new Map<string, {
      user: {
        id: string
        displayName: string
        avatarUrl?: string
      }
      totalLoad: number
      workoutsCount: number
      setsCount: number
    }>()

    for (const workout of workouts) {
      const userId = workout.user.id
      const workoutLoad = workout.sets.reduce(
        (sum, set) => sum + set.weightKg * set.reps,
        0
      )

      if (userLoads.has(userId)) {
        const current = userLoads.get(userId)!
        userLoads.set(userId, {
          ...current,
          totalLoad: current.totalLoad + workoutLoad,
          workoutsCount: current.workoutsCount + 1,
          setsCount: current.setsCount + workout.sets.length,
        })
      } else {
        userLoads.set(userId, {
          user: {
            id: workout.user.id,
            displayName: workout.user.displayName,
            avatarUrl: workout.user.avatarUrl ?? undefined,
          },
          totalLoad: workoutLoad,
          workoutsCount: 1,
          setsCount: workout.sets.length,
        })
      }
    }

    // Convert to array and sort by total load
    const ranking = Array.from(userLoads.values())
      .sort((a, b) => b.totalLoad - a.totalLoad)
      .slice(0, 20) // Top 20
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
        totalLoadDisplay: Math.round(entry.totalLoad).toLocaleString(),
        totalLoadTons: (entry.totalLoad / 1000).toFixed(2),
        isCurrentUser: entry.user.id === session.user.id,
      }))

    return NextResponse.json({
      ranking,
      period: {
        start: startDate,
        end: endDate,
      },
    })
  } catch (error) {
    console.error('Error fetching ranking:', error)
    return NextResponse.json(
      { error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    )
  }
}
