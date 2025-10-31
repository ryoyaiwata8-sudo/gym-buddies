import { prisma } from './prisma';

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'NEW_POST' | 'GOAL_ACHIEVED';

interface CreateNotificationParams {
  userId: string; // 通知を受け取るユーザー
  type: NotificationType;
  actorId?: string; // 通知を発生させたユーザー（LIKE, COMMENT, FOLLOW, NEW_POSTの場合）
  workoutId?: string; // 関連するワークアウト（LIKE, COMMENT, NEW_POSTの場合）
  goalId?: string; // 関連する目標（GOAL_ACHIEVEDの場合）
}

/**
 * 通知を作成する
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, actorId, workoutId, goalId } = params;

  // 自分自身への通知は作成しない（フォロー以外）
  if (actorId && actorId === userId && type !== 'GOAL_ACHIEVED') {
    return null;
  }

  // ユーザーの通知設定を確認
  const settings = await prisma.notification_settings.findUnique({
    where: { userId },
  });

  // 通知設定が存在しない場合はデフォルトで通知を作成
  // 設定が存在する場合は、各通知タイプの設定を確認
  if (settings) {
    if (type === 'LIKE' && !settings.enableLikeNotif) return null;
    if (type === 'COMMENT' && !settings.enableCommentNotif) return null;
    if (type === 'FOLLOW' && !settings.enableFollowNotif) return null;
    if (type === 'NEW_POST' && !settings.enableNewPostNotif) return null;
    if (type === 'GOAL_ACHIEVED' && !settings.enableGoalAchievedNotif) return null;
  }

  return await prisma.notifications.create({
    data: {
      userId,
      type,
      actorId,
      workoutId,
      goalId,
    },
  });
}

/**
 * フォロワーに新規投稿通知を送信する
 */
export async function notifyFollowersOfNewPost(workoutId: string, userId: string) {
  // ユーザーのフォロワーを取得
  const followers = await prisma.follow.findMany({
    where: {
      followeeId: userId,
    },
    select: {
      followerId: true,
    },
  });

  // 各フォロワーに通知を作成
  const notifications = followers.map((follower) =>
    createNotification({
      userId: follower.followerId,
      type: 'NEW_POST',
      actorId: userId,
      workoutId,
    })
  );

  await Promise.all(notifications);
}
