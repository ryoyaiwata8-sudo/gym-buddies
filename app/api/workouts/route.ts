import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface SetInput {
  weightKg: number
  reps: number
  rpe?: number | null
  note?: string | null
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { exerciseId, sets, note, privacy } = await request.json()

    // Validation
    if (!exerciseId || !sets || sets.length === 0) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    // Validate each set
    for (const set of sets as SetInput[]) {
      if (set.weightKg <= 0 || set.weightKg > 500) {
        return NextResponse.json(
          { error: '重量は0〜500kgの範囲で入力してください' },
          { status: 400 }
        )
      }
      if (set.reps < 1 || set.reps > 50) {
        return NextResponse.json(
          { error: '回数は1〜50の範囲で入力してください' },
          { status: 400 }
        )
      }
      if (set.rpe !== null && set.rpe !== undefined) {
        if (set.rpe < 5 || set.rpe > 10) {
          return NextResponse.json(
            { error: 'RPEは5〜10の範囲で入力してください' },
            { status: 400 }
          )
        }
      }
    }

    // Check for PRs
    const prs: { type: string; value: number }[] = []

    // Get user's previous bests for this exercise
    const previousSets = await prisma.set.findMany({
      where: {
        exerciseId,
        workout: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const maxWeight = Math.max(...previousSets.map((s) => s.weightKg), 0)
    const maxVolume = Math.max(
      ...previousSets.map((s) => s.weightKg * s.reps),
      0
    )

    // Create workout
    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        date: new Date(),
        note: note || null,
        privacy: privacy || 'friends',
        sets: {
          create: (sets as SetInput[]).map((set) => {
            const volume = set.weightKg * set.reps
            let prType: string | null = null

            // Check for weight PR
            if (set.weightKg > maxWeight) {
              prs.push({ type: '重量PR', value: set.weightKg })
              prType = 'weight'
            }
            // Check for volume PR
            else if (volume > maxVolume) {
              prs.push({ type: '体積PR', value: volume })
              prType = 'volume'
            }

            return {
              exerciseId,
              weightKg: set.weightKg,
              reps: set.reps,
              rpe: set.rpe || null,
              note: set.note || null,
              prType,
            }
          }),
        },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: '保存しました',
      workout,
      prs: prs.length > 0 ? prs : undefined,
    })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: '保存に失敗しました' },
      { status: 500 }
    )
  }
}
