import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Accept or reject follow request
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { action } = await request.json() // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'actionは accept または reject である必要があります' },
        { status: 400 }
      )
    }

    // Get follow request
    const followRequest = await prisma.follow.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!followRequest) {
      return NextResponse.json(
        { error: 'フォローリクエストが見つかりません' },
        { status: 404 }
      )
    }

    // Check if the current user is the followee (receiver of the request)
    if (followRequest.followeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'このリクエストを承認/拒否する権限がありません' },
        { status: 403 }
      )
    }

    // Check if already processed
    if (followRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'このリクエストは既に処理されています' },
        { status: 400 }
      )
    }

    // Update follow request status
    const updatedFollow = await prisma.follow.update({
      where: {
        id: params.id,
      },
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected',
      },
    })

    // If accepted, create notification for the requester
    if (action === 'accept') {
      await prisma.notifications.create({
        data: {
          userId: followRequest.followerId,
          type: 'FOLLOW_ACCEPTED',
          actorId: session.user.id,
          followId: params.id,
        },
      })
    }

    return NextResponse.json({
      message: action === 'accept' ? 'フォローリクエストを承認しました' : 'フォローリクエストを拒否しました',
      follow: updatedFollow,
    })
  } catch (error) {
    console.error('Error updating follow request:', error)
    return NextResponse.json(
      { error: 'フォローリクエストの更新に失敗しました' },
      { status: 500 }
    )
  }
}
