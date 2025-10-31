import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch single template by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const template = await prisma.workoutTemplate.findUnique({
      where: {
        id: params.id,
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

    if (!template || template.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT - Update a template
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { name, description, exercises } = await request.json()

    // Check if template belongs to user
    const existingTemplate = await prisma.workoutTemplate.findUnique({
      where: { id: params.id },
    })

    if (!existingTemplate || existingTemplate.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      )
    }

    // Validation
    if (name && !name.trim()) {
      return NextResponse.json(
        { error: 'テンプレート名は必須です' },
        { status: 400 }
      )
    }

    if (exercises && (!Array.isArray(exercises) || exercises.length === 0)) {
      return NextResponse.json(
        { error: '少なくとも1つの種目を含める必要があります' },
        { status: 400 }
      )
    }

    // Update template
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null

    // If exercises are provided, delete old ones and create new ones
    if (exercises) {
      // Delete existing exercises
      await prisma.templateExercise.deleteMany({
        where: { templateId: params.id },
      })

      // Create new exercises
      updateData.exercises = {
        create: exercises.map((ex: any, index: number) => ({
          exerciseId: ex.exerciseId || ex,
          order: index,
        })),
      }
    }

    const template = await prisma.workoutTemplate.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'テンプレートを更新しました',
      template,
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'テンプレートの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // Check if template belongs to user
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template || template.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.workoutTemplate.delete({
      where: { id: params.id },
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
