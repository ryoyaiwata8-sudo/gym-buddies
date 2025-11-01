import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all templates for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const templates = await prisma.workoutTemplate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - Create a new template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { name, description, exercises } = await request.json()

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'テンプレート名は必須です' },
        { status: 400 }
      )
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: '少なくとも1つの種目を含める必要があります' },
        { status: 400 }
      )
    }

    // Convert exercise names to IDs
    const exerciseRecords = await prisma.exercise.findMany({
      where: {
        name: {
          in: exercises,
        },
      },
    })

    if (exerciseRecords.length === 0) {
      return NextResponse.json(
        { error: '指定された種目が見つかりませんでした' },
        { status: 400 }
      )
    }

    // Create a map to preserve order
    const nameToId: Record<string, string> = {}
    exerciseRecords.forEach((ex) => {
      nameToId[ex.name] = ex.id
    })

    // Map exercises to IDs in the correct order
    const exerciseIds = exercises
      .map((name: string) => nameToId[name])
      .filter(Boolean)

    if (exerciseIds.length !== exercises.length) {
      return NextResponse.json(
        { error: '一部の種目が見つかりませんでした' },
        { status: 400 }
      )
    }

    // Create template with nested exercises (no sets data)
    const template = await prisma.workoutTemplate.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        exercises: {
          create: exerciseIds.map((exerciseId: string, index: number) => ({
            exerciseId,
            order: index,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json({
      message: 'テンプレートを作成しました',
      template,
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'テンプレートの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template
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
        { error: 'テンプレートIDが必要です' },
        { status: 400 }
      )
    }

    // Check if template belongs to user
    const template = await prisma.workoutTemplate.findUnique({
      where: { id },
    })

    if (!template || template.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.workoutTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'テンプレートを削除しました' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'テンプレートの削除に失敗しました' },
      { status: 500 }
    )
  }
}
