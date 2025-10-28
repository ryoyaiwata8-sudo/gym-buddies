import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get users that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followeeId: true },
    })

    const followingIds = following.map((f) => f.followeeId)

    // Fetch workouts from followed users + own workouts
    // Only show 'friends' privacy workouts (not 'private')
    const workouts = await prisma.workout.findMany({
      where: {
        OR: [
          {
            userId: { in: followingIds },
            privacy: 'friends',
          },
          {
            userId: session.user.id, // Always show own workouts
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        sets: {
          include: {
            exercise: true,
          },
          take: 3, // Only show first 3 sets in feed
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            sets: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Format the response
    const formattedWorkouts = workouts.map((workout) => ({
      id: workout.id,
      user: workout.user,
      date: workout.date,
      note: workout.note,
      createdAt: workout.createdAt,
      totalSets: workout._count.sets,
      sets: workout.sets.map((set) => ({
        id: set.id,
        exercise: set.exercise.name,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        prType: set.prType,
      })),
      likesCount: workout._count.likes,
      likedByMe: workout.likes.some((like) => like.userId === session.user.id),
      totalLoad: workout.sets.reduce(
        (sum, set) => sum + set.weightKg * set.reps,
        0
      ),
    }))

    return NextResponse.json({
      workouts: formattedWorkouts,
      hasMore: workouts.length === limit,
    })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'フィードの取得に失敗しました' },
      { status: 500 }
    )
  }
}
