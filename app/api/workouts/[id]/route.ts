import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const workout = await prisma.workout.findUnique({
      where: { id: params.id },
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
    })

    if (!workout) {
      return NextResponse.json({ error: 'ワークアウトが見つかりません' }, { status: 404 })
    }

    if (workout.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // Check ownership
    const workout = await prisma.workout.findUnique({
      where: { id: params.id },
    })

    if (!workout) {
      return NextResponse.json({ error: 'ワークアウトが見つかりません' }, { status: 404 })
    }

    if (workout.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // Delete workout (sets will be cascade deleted)
    await prisma.workout.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'ワークアウトを削除しました' })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'ワークアウトの削除に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { sets, note, privacy } = await request.json()

    // Check ownership
    const workout = await prisma.workout.findUnique({
      where: { id: params.id },
    })

    if (!workout) {
      return NextResponse.json({ error: 'ワークアウトが見つかりません' }, { status: 404 })
    }

    if (workout.userId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
    }

    // Delete existing sets
    await prisma.set.deleteMany({
      where: { workoutId: params.id },
    })

    // Create new sets
    const exerciseId = sets[0].exerciseId
    await prisma.set.createMany({
      data: sets.map((set: any) => ({
        workoutId: params.id,
        exerciseId,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe || null,
        note: set.note || null,
      })),
    })

    // Update workout
    const updatedWorkout = await prisma.workout.update({
      where: { id: params.id },
      data: {
        note: note || null,
        privacy: privacy || 'FRIENDS',
      },
    })

    return NextResponse.json({ workout: updatedWorkout })
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: 'ワークアウトの更新に失敗しました' },
      { status: 500 }
    )
  }
}
