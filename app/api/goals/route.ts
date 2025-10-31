import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all goals for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exercise: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - Create a new goal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { type, targetValue, deadline, exerciseId } = await request.json()

    // Validation
    if (!type || !targetValue) {
      return NextResponse.json(
        { error: 'タイプと目標値は必須です' },
        { status: 400 }
      )
    }

    if (!['bodyWeight', 'weeklyVolume', 'exerciseWeight'].includes(type)) {
      return NextResponse.json(
        { error: '無効な目標タイプです' },
        { status: 400 }
      )
    }

    if (targetValue <= 0) {
      return NextResponse.json(
        { error: '目標値は0より大きい値を入力してください' },
        { status: 400 }
      )
    }

    if (type === 'exerciseWeight' && !exerciseId) {
      return NextResponse.json(
        { error: '種目別目標には種目の選択が必要です' },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        type,
        targetValue,
        deadline: deadline ? new Date(deadline) : null,
        exerciseId: type === 'exerciseWeight' ? exerciseId : null,
      },
      include: {
        exercise: true,
      },
    })

    return NextResponse.json({
      message: '目標を作成しました',
      goal,
    })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: '目標の作成に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT - Update a goal
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { id, targetValue, deadline, completed } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: '目標IDが必要です' },
        { status: 400 }
      )
    }

    // Check if goal belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
    })

    if (!existingGoal || existingGoal.userId !== session.user.id) {
      return NextResponse.json(
        { error: '目標が見つかりません' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (targetValue !== undefined) updateData.targetValue = targetValue
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (completed !== undefined) {
      updateData.completed = completed
      if (completed && !existingGoal.completed) {
        updateData.completedAt = new Date()
      }
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: {
        exercise: true,
      },
    })

    return NextResponse.json({
      message: '目標を更新しました',
      goal,
    })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { error: '目標の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a goal
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
        { error: '目標IDが必要です' },
        { status: 400 }
      )
    }

    // Check if goal belongs to user
    const goal = await prisma.goal.findUnique({
      where: { id },
    })

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: '目標が見つかりません' },
        { status: 404 }
      )
    }

    await prisma.goal.delete({
      where: { id },
    })

    return NextResponse.json({ message: '目標を削除しました' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: '目標の削除に失敗しました' },
      { status: 500 }
    )
  }
}
