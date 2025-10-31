import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch body composition records
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    const records = await prisma.bodyComposition.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Error fetching body composition records:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - Create new body composition record
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { date, bodyWeightKg, bodyFatPercent, note } = await request.json()

    // Validation
    if (!date || !bodyWeightKg) {
      return NextResponse.json(
        { error: '日付と体重は必須です' },
        { status: 400 }
      )
    }

    if (bodyWeightKg <= 0 || bodyWeightKg > 300) {
      return NextResponse.json(
        { error: '体重は0〜300kgの範囲で入力してください' },
        { status: 400 }
      )
    }

    if (bodyFatPercent !== null && bodyFatPercent !== undefined) {
      if (bodyFatPercent < 0 || bodyFatPercent > 100) {
        return NextResponse.json(
          { error: '体脂肪率は0〜100%の範囲で入力してください' },
          { status: 400 }
        )
      }
    }

    const record = await prisma.bodyComposition.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        bodyWeightKg,
        bodyFatPercent: bodyFatPercent || null,
        note: note || null,
      },
    })

    // Also update the user's current body weight
    await prisma.user.update({
      where: { id: session.user.id },
      data: { bodyWeightKg },
    })

    return NextResponse.json({
      message: '記録しました',
      record,
    })
  } catch (error) {
    console.error('Error creating body composition record:', error)
    return NextResponse.json(
      { error: '記録に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a body composition record
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
        { error: 'IDが必要です' },
        { status: 400 }
      )
    }

    // Check if the record belongs to the user
    const record = await prisma.bodyComposition.findUnique({
      where: { id },
    })

    if (!record || record.userId !== session.user.id) {
      return NextResponse.json(
        { error: '記録が見つかりません' },
        { status: 404 }
      )
    }

    await prisma.bodyComposition.delete({
      where: { id },
    })

    return NextResponse.json({ message: '削除しました' })
  } catch (error) {
    console.error('Error deleting body composition record:', error)
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 }
    )
  }
}
