import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

// Add like
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { workoutId } = await request.json()

    if (!workoutId) {
      return NextResponse.json(
        { error: 'workoutIdが必要です' },
        { status: 400 }
      )
    }

    // Check if workout exists
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'ワークアウトが見つかりません' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        workoutId_userId: {
          workoutId,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'すでにいいね済みです' },
        { status: 400 }
      )
    }

    // Create like
    const like = await prisma.like.create({
      data: {
        workoutId,
        userId: session.user.id,
      },
    })

    // Create notification for the workout owner
    await createNotification({
      userId: workout.userId,
      type: 'LIKE',
      actorId: session.user.id,
      workoutId,
    })

    return NextResponse.json({ message: 'いいねしました', like })
  } catch (error) {
    console.error('Error creating like:', error)
    return NextResponse.json(
      { error: 'いいねに失敗しました' },
      { status: 500 }
    )
  }
}

// Remove like
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get('workoutId')

    if (!workoutId) {
      return NextResponse.json(
        { error: 'workoutIdが必要です' },
        { status: 400 }
      )
    }

    // Delete like
    await prisma.like.delete({
      where: {
        workoutId_userId: {
          workoutId,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ message: 'いいねを取り消しました' })
  } catch (error) {
    console.error('Error deleting like:', error)
    return NextResponse.json(
      { error: 'いいねの取り消しに失敗しました' },
      { status: 500 }
    )
  }
}
