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
    const query = searchParams.get('query') || ''

    // Search users by display name or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } }, // Exclude current user
          {
            OR: [
              { displayName: { contains: query } },
              { email: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        email: true, // Show email for search purposes
      },
      take: 20,
    })

    // Get follow status for each user
    const follows = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followeeId: { in: users.map((u) => u.id) },
      },
      select: {
        followeeId: true,
        status: true,
      },
    })

    const followMap = new Map(follows.map((f) => [f.followeeId, f.status]))

    const usersWithFollowStatus = users.map((user) => ({
      ...user,
      followStatus: followMap.get(user.id) || 'none', // none, pending, accepted, rejected
    }))

    return NextResponse.json({ users: usersWithFollowStatus })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'ユーザー検索に失敗しました' },
      { status: 500 }
    )
  }
}
