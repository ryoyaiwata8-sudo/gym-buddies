import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyFollowersOfNewPost } from '@/lib/notifications';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * PATCH /api/workouts/publish
 * 今日の未公開ワークアウトをすべて公開する
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // 今日の未公開ワークアウトを取得
    const unpublishedWorkouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        isPublished: false,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    if (unpublishedWorkouts.length === 0) {
      return NextResponse.json(
        { error: '公開するワークアウトがありません' },
        { status: 404 }
      );
    }

    // すべてのワークアウトを公開に変更
    await prisma.workout.updateMany({
      where: {
        userId: session.user.id,
        isPublished: false,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // フォロワーに通知を送信（最初のワークアウトIDを使用）
    if (unpublishedWorkouts.length > 0 && unpublishedWorkouts[0].privacy === 'friends') {
      await notifyFollowersOfNewPost(unpublishedWorkouts[0].id, session.user.id);
    }

    // 公開されたワークアウトの概要を返す
    const summary = {
      totalWorkouts: unpublishedWorkouts.length,
      exercises: unpublishedWorkouts.map(w => ({
        name: w.sets[0]?.exercise.name || '不明',
        sets: w.sets.length,
      })),
    };

    return NextResponse.json({
      message: 'ワークアウトを公開しました',
      summary,
    });
  } catch (error) {
    console.error('Failed to publish workouts:', error);
    return NextResponse.json(
      { error: 'Failed to publish workouts' },
      { status: 500 }
    );
  }
}
