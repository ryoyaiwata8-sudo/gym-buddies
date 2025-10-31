import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notifications/settings
 * 通知設定を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 設定を取得（存在しない場合はデフォルトを返す）
    let settings = await prisma.notification_settings.findUnique({
      where: { userId: session.user.id },
    });

    // 設定が存在しない場合はデフォルトで作成
    if (!settings) {
      settings = await prisma.notification_settings.create({
        data: {
          userId: session.user.id,
          enableLikeNotif: true,
          enableCommentNotif: true,
          enableFollowNotif: true,
          enableNewPostNotif: true,
          enableGoalAchievedNotif: true,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/settings
 * 通知設定を更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      enableLikeNotif,
      enableCommentNotif,
      enableFollowNotif,
      enableNewPostNotif,
      enableGoalAchievedNotif,
    } = body;

    // 既存の設定を取得または作成
    const existingSettings = await prisma.notification_settings.findUnique({
      where: { userId: session.user.id },
    });

    let settings;
    if (existingSettings) {
      // 更新
      settings = await prisma.notification_settings.update({
        where: { userId: session.user.id },
        data: {
          enableLikeNotif: enableLikeNotif ?? existingSettings.enableLikeNotif,
          enableCommentNotif: enableCommentNotif ?? existingSettings.enableCommentNotif,
          enableFollowNotif: enableFollowNotif ?? existingSettings.enableFollowNotif,
          enableNewPostNotif: enableNewPostNotif ?? existingSettings.enableNewPostNotif,
          enableGoalAchievedNotif: enableGoalAchievedNotif ?? existingSettings.enableGoalAchievedNotif,
          updatedAt: new Date(),
        },
      });
    } else {
      // 新規作成
      settings = await prisma.notification_settings.create({
        data: {
          userId: session.user.id,
          enableLikeNotif: enableLikeNotif ?? true,
          enableCommentNotif: enableCommentNotif ?? true,
          enableFollowNotif: enableFollowNotif ?? true,
          enableNewPostNotif: enableNewPostNotif ?? true,
          enableGoalAchievedNotif: enableGoalAchievedNotif ?? true,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
