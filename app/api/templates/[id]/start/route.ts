import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Start a workout from template
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { date, privacy } = await request.json()

    // Fetch template
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: params.id },
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

    // Return template exercises for the client to use
    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        exercises: template.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exercise: ex.exercise,
          order: ex.order,
        })),
      },
    })
  } catch (error) {
    console.error('Error starting workout from template:', error)
    return NextResponse.json(
      { error: 'ワークアウトの作成に失敗しました' },
      { status: 500 }
    )
  }
}
