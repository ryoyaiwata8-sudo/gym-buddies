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

    // Fetch all active goals
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exercise: true,
      },
    })

    // Calculate progress for each goal with error handling
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        try {
          let currentValue = 0
          let progress = 0

          switch (goal.type) {
            case 'bodyWeight':
              // Get latest body weight
              const latestBodyComp = await prisma.bodyComposition.findFirst({
                where: { userId: session.user.id },
                orderBy: { date: 'desc' },
              })
              currentValue = latestBodyComp?.bodyWeightKg || 0
              progress = currentValue > 0 ? (currentValue / goal.targetValue) * 100 : 0
              break

            case 'weeklyVolume':
              // Get this week's total volume
              const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
              const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

              const thisWeekWorkouts = await prisma.workout.findMany({
                where: {
                  userId: session.user.id,
                  date: {
                    gte: weekStart,
                    lte: weekEnd,
                  },
                },
                include: {
                  sets: true,
                },
              })

              currentValue = thisWeekWorkouts.reduce((total, workout) => {
                return (
                  total +
                  workout.sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0)
                )
              }, 0)

              progress = (currentValue / goal.targetValue) * 100
              break

            case 'exerciseWeight':
              // Get max weight for specific exercise
              if (goal.exerciseId) {
                const maxWeightSet = await prisma.set.findFirst({
                  where: {
                    exerciseId: goal.exerciseId,
                    workout: {
                      userId: session.user.id,
                    },
                  },
                  orderBy: {
                    weightKg: 'desc',
                  },
                })

                currentValue = maxWeightSet?.weightKg || 0
                progress = (currentValue / goal.targetValue) * 100
              }
              break
          }

          // Check if goal is achieved
          let achieved = false
          if (goal.type === 'bodyWeight') {
            // For body weight, check if within 1kg of target
            achieved = Math.abs(currentValue - goal.targetValue) <= 1
          } else {
            // For other goals, check if current >= target
            achieved = currentValue >= goal.targetValue
          }

          // Auto-complete goal if achieved and not already completed
          if (achieved && !goal.completed) {
            try {
              await prisma.goal.update({
                where: { id: goal.id },
                data: {
                  completed: true,
                  completedAt: new Date(),
                },
              })
            } catch (updateError) {
              console.error(`Failed to auto-complete goal ${goal.id}:`, updateError)
              // Continue even if update fails
            }
          }

          return {
            ...goal,
            currentValue: Math.round(currentValue * 10) / 10,
            progress: Math.min(Math.round(progress * 10) / 10, 100),
            achieved,
          }
        } catch (error) {
          console.error(`Error calculating progress for goal ${goal.id}:`, error)
          // Return goal with default values if calculation fails
          return {
            ...goal,
            currentValue: 0,
            progress: 0,
            achieved: false,
          }
        }
      })
    )

    return NextResponse.json({ goals: goalsWithProgress })
  } catch (error) {
    console.error('Error fetching goal progress:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
