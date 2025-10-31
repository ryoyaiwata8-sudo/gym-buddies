import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

// Follow a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { followeeId } = await request.json()

    if (!followeeId) {
      return NextResponse.json(
        { error: 'followeeIdが必要です' },
        { status: 400 }
      )
    }

    if (followeeId === session.user.id) {
      return NextResponse.json(
        { error: '自分自身をフォローできません' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: followeeId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followeeId: {
          followerId: session.user.id,
          followeeId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json(
        { error: 'すでにフォロー済みです' },
        { status: 400 }
      )
    }

    // Create follow
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followeeId,
      },
    })

    // Create notification for the followed user
    await createNotification({
      userId: followeeId,
      type: 'FOLLOW',
      actorId: session.user.id,
    })

    return NextResponse.json({ message: 'フォローしました', follow })
  } catch (error) {
    console.error('Error creating follow:', error)
    return NextResponse.json(
      { error: 'フォローに失敗しました' },
      { status: 500 }
    )
  }
}

// Unfollow a user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const followeeId = searchParams.get('followeeId')

    if (!followeeId) {
      return NextResponse.json(
        { error: 'followeeIdが必要です' },
        { status: 400 }
      )
    }

    // Delete follow
    await prisma.follow.delete({
      where: {
        followerId_followeeId: {
          followerId: session.user.id,
          followeeId,
        },
      },
    })

    return NextResponse.json({ message: 'フォローを解除しました' })
  } catch (error) {
    console.error('Error deleting follow:', error)
    return NextResponse.json(
      { error: 'フォロー解除に失敗しました' },
      { status: 500 }
    )
  }
}
