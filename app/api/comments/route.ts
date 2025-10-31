import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

// GET - Fetch comments for a workout
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get('workoutId')

    if (!workoutId) {
      return NextResponse.json(
        { error: 'ワークアウトIDが必要です' },
        { status: 400 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: {
        workoutId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'コメントの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { workoutId, content } = await request.json()

    // Validation
    if (!workoutId || !content) {
      return NextResponse.json(
        { error: 'ワークアウトIDとコメント内容は必須です' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'コメント内容を入力してください' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'コメントは500文字以内で入力してください' },
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

    const comment = await prisma.comment.create({
      data: {
        workoutId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Create notification for the workout owner
    await createNotification({
      userId: workout.userId,
      type: 'COMMENT',
      actorId: session.user.id,
      workoutId,
    })

    return NextResponse.json({
      message: 'コメントを投稿しました',
      comment,
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'コメントの投稿に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'コメントIDが必要です' },
        { status: 400 }
      )
    }

    // Check if the comment belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'コメントが見つかりません' },
        { status: 404 }
      )
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: '削除する権限がありません' },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'コメントを削除しました' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'コメントの削除に失敗しました' },
      { status: 500 }
    )
  }
}
