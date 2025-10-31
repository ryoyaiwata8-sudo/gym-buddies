import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

/**
 * GET /api/export/body
 * 体組成データをCSV形式でエクスポート
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

    // 体組成データを取得
    const bodyCompositions = await prisma.bodyComposition.findMany({
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
      orderBy: {
        date: 'asc',
      },
    });

    // CSVヘッダー
    const headers = [
      '日付',
      '体重(kg)',
      '体脂肪率(%)',
      'BMI',
      'メモ',
    ];

    // CSVデータを生成
    const rows: string[][] = [headers];

    // ユーザーの身長を取得してBMI計算に使用
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { heightCm: true },
    });

    bodyCompositions.forEach((record) => {
      const recordDate = format(new Date(record.date), 'yyyy-MM-dd');

      // BMI計算（身長がある場合）
      let bmi = '';
      if (user?.heightCm) {
        const heightM = user.heightCm / 100;
        const calculatedBmi = record.bodyWeightKg / (heightM * heightM);
        bmi = calculatedBmi.toFixed(1);
      }

      rows.push([
        recordDate,
        String(record.bodyWeightKg),
        record.bodyFatPercent ? String(record.bodyFatPercent) : '',
        bmi,
        record.note || '',
      ]);
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
        'Content-Disposition': `attachment; filename="body_composition_${format(new Date(), 'yyyyMMdd')}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export body composition:', error);
    return NextResponse.json(
      { error: 'Failed to export body composition' },
      { status: 500 }
    );
  }
}
