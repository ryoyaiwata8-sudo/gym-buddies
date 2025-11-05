import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get user profile (only for accepted follows)
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        bodyWeightKg: true,
        heightCm: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // Check if viewing own profile
    if (userId === session.user.id) {
      // Get total stats for own profile
      const workouts = await prisma.workout.findMany({
        where: { userId },
        include: {
          sets: true,
        },
      })

      const totalWorkouts = workouts.length
      const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0)
      const totalLoad = workouts.reduce(
        (sum, w) => sum + w.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
        0
      )

      return NextResponse.json({
        user,
        stats: {
          totalWorkouts,
          totalSets,
          totalLoad,
        },
        isOwnProfile: true,
        isFriend: true,
      })
    }

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
      return NextResponse.json({
        user: {
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        },
        isFriend: false,
        message: 'このユーザーと友達になるとプロフィールが見れます',
      })
    }

    // Get user stats for friends
    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        isPublished: true,
        privacy: 'friends',
      },
      include: {
        sets: true,
      },
    })

    const totalWorkouts = workouts.length
    const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0)
    const totalLoad = workouts.reduce(
      (sum, w) => sum + w.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
      0
    )

    return NextResponse.json({
      user,
      stats: {
        totalWorkouts,
        totalSets,
        totalLoad,
      },
      isOwnProfile: false,
      isFriend: true,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'プロフィールの取得に失敗しました' },
      { status: 500 }
    )
  }
}
