import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

/**
 * GET /api/export/workouts
 * ワークアウト履歴をCSV形式でエクスポート
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // クエリパラメータから期間を取得
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // ワークアウトデータを取得
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        ...(startDate && endDate
          ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
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
      orderBy: {
        date: 'asc',
      },
    });

    // CSVヘッダー
    const headers = [
      '日付',
      '種目',
      '部位',
      'セット番号',
      '重量(kg)',
      '回数',
      'RPE',
      '総負荷量(kg)',
      'PR',
      'メモ',
    ];

    // CSVデータを生成
    const rows: string[][] = [headers];

    workouts.forEach((workout) => {
      const workoutDate = format(new Date(workout.date), 'yyyy-MM-dd');

      workout.sets.forEach((set, index) => {
        const totalLoad = set.weightKg * set.reps;
        rows.push([
          workoutDate,
          set.exercise.name,
          set.exercise.bodyPart,
          String(index + 1),
          String(set.weightKg),
          String(set.reps),
          set.rpe ? String(set.rpe) : '',
          String(totalLoad),
          set.prType || '',
          set.note || '',
        ]);
      });

      // ワークアウトメモがある場合は追加行として記載
      if (workout.note) {
        rows.push([
          workoutDate,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          `[ワークアウトメモ] ${workout.note}`,
        ]);
      }
    });

    // CSVテキストを生成（UTF-8 BOM付き for Excel）
    const csvContent = '\uFEFF' + rows.map(row =>
      row.map(cell => {
        // セルにカンマや改行が含まれる場合はダブルクォートで囲む
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // レスポンスを返す
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="workouts_${format(new Date(), 'yyyyMMdd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export workouts:', error);
    return NextResponse.json(
      { error: 'Failed to export workouts' },
      { status: 500 }
    );
  }
}
