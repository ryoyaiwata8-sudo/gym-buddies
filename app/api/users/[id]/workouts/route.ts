import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get user's workout history (only for accepted follows)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const userId = params.id

    // Check if viewing own workouts
    const isOwnProfile = userId === session.user.id

    if (!isOwnProfile) {
      // Check if they are accepted friends
      const friendship = await prisma.follow.findFirst({
        where: {
          OR: [
            { followerId: session.user.id, followeeId: userId, status: 'accepted' },
            { followerId: userId, followeeId: session.user.id, status: 'accepted' },
          ],
        },
      })

      if (!friendship) {
        return NextResponse.json(
          { error: '友達になっていないため、ワークアウトを見ることができません' },
          { status: 403 }
        )
      }
    }

    // Get workout history
    const workouts = await prisma.workout.findMany({
      where: isOwnProfile
        ? { userId }
        : {
            userId,
            isPublished: true,
            privacy: 'friends',
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
      take: 50,
    })

    // Group sets by exercise for each workout
    const formattedWorkouts = workouts.map((workout) => {
      // Group sets by exercise
      const exerciseMap = new Map<string, any[]>()

      workout.sets.forEach((set) => {
        const exerciseName = set.exercise.name
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, [])
        }
        exerciseMap.get(exerciseName)!.push({
          id: set.id,
          weightKg: set.weightKg,
          reps: set.reps,
          rpe: set.rpe,
          prType: set.prType,
        })
      })

      const exercises = Array.from(exerciseMap.entries()).map(([name, sets]) => ({
        name,
        sets,
        bodyPart: workout.sets.find(s => s.exercise.name === name)?.exercise.bodyPart,
      }))

      const totalSets = workout.sets.length
      const totalLoad = workout.sets.reduce(
        (sum, set) => sum + set.weightKg * set.reps,
        0
      )

      return {
        id: workout.id,
        date: workout.date,
        note: workout.note,
        exercises,
        totalSets,
        totalLoad,
      }
    })

    return NextResponse.json({ workouts: formattedWorkouts })
  } catch (error) {
    console.error('Error fetching user workouts:', error)
    return NextResponse.json(
      { error: 'ワークアウト履歴の取得に失敗しました' },
      { status: 500 }
    )
  }
}
