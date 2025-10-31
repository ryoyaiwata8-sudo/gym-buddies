import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user profile
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bodyWeightKg: true,
        heightCm: true,
        bio: true,
        unitPref: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'プロフィールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { displayName, avatarUrl, bodyWeightKg, heightCm, bio, unitPref } =
      await request.json()

    // Validation
    if (displayName !== undefined && displayName.trim().length === 0) {
      return NextResponse.json(
        { error: '表示名は必須です' },
        { status: 400 }
      )
    }

    if (bodyWeightKg !== null && bodyWeightKg !== undefined) {
      if (bodyWeightKg <= 0 || bodyWeightKg > 300) {
        return NextResponse.json(
          { error: '体重は0〜300kgの範囲で入力してください' },
          { status: 400 }
        )
      }
    }

    if (heightCm !== null && heightCm !== undefined) {
      if (heightCm <= 0 || heightCm > 300) {
        return NextResponse.json(
          { error: '身長は0〜300cmの範囲で入力してください' },
          { status: 400 }
        )
      }
    }

    if (bio !== null && bio !== undefined && bio.length > 500) {
      return NextResponse.json(
        { error: '自己紹介は500文字以内で入力してください' },
        { status: 400 }
      )
    }

    if (unitPref !== undefined && !['kg', 'lbs'].includes(unitPref)) {
      return NextResponse.json(
        { error: '単位は kg または lbs を選択してください' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}
    if (displayName !== undefined) updateData.displayName = displayName.trim()
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (bodyWeightKg !== undefined) updateData.bodyWeightKg = bodyWeightKg || null
    if (heightCm !== undefined) updateData.heightCm = heightCm || null
    if (bio !== undefined) updateData.bio = bio || null
    if (unitPref !== undefined) updateData.unitPref = unitPref

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bodyWeightKg: true,
        heightCm: true,
        bio: true,
        unitPref: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: 'プロフィールを更新しました',
      user,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    )
  }
}
