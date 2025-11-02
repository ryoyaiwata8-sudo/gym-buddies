import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const exercises = [
  // Chest (胸)
  { name: 'ベンチプレス', bodyPart: 'chest' },
  { name: 'インクラインベンチプレス', bodyPart: 'chest' },
  { name: 'デクラインベンチプレス', bodyPart: 'chest' },
  { name: 'ダンベルプレス', bodyPart: 'chest' },
  { name: 'インクラインダンベルプレス', bodyPart: 'chest' },
  { name: 'ダンベルフライ', bodyPart: 'chest' },
  { name: 'ケーブルクロスオーバー', bodyPart: 'chest' },
  { name: '腕立て伏せ', bodyPart: 'chest' },
  { name: 'ディップス（胸）', bodyPart: 'chest' },

  // Arms (腕)
  { name: 'バーベルカール', bodyPart: 'arms' },
  { name: 'ダンベルカール', bodyPart: 'arms' },
  { name: 'ハンマーカール', bodyPart: 'arms' },
  { name: 'プリチャーカール', bodyPart: 'arms' },
  { name: 'ケーブルカール', bodyPart: 'arms' },
  { name: 'トライセプスプッシュダウン', bodyPart: 'arms' },
  { name: 'オーバーヘッドトライセプスエクステンション', bodyPart: 'arms' },
  { name: 'スカルクラッシャー', bodyPart: 'arms' },
  { name: 'ディップス（上腕三頭筋）', bodyPart: 'arms' },
  { name: 'ナローグリップベンチプレス', bodyPart: 'arms' },

  // Shoulders (肩)
  { name: 'ショルダープレス', bodyPart: 'shoulders' },
  { name: 'ダンベルショルダープレス', bodyPart: 'shoulders' },
  { name: 'サイドレイズ', bodyPart: 'shoulders' },
  { name: 'フロントレイズ', bodyPart: 'shoulders' },
  { name: 'リアデルトフライ', bodyPart: 'shoulders' },
  { name: 'アーノルドプレス', bodyPart: 'shoulders' },
  { name: 'アップライトロウ', bodyPart: 'shoulders' },
  { name: 'シュラッグ', bodyPart: 'shoulders' },

  // Back (背中)
  { name: 'デッドリフト', bodyPart: 'back' },
  { name: '懸垂', bodyPart: 'back' },
  { name: 'チンアップ', bodyPart: 'back' },
  { name: 'ベントオーバーロウ', bodyPart: 'back' },
  { name: 'Tバーロウ', bodyPart: 'back' },
  { name: 'シーテッドケーブルロウ', bodyPart: 'back' },
  { name: 'ワンアームダンベルロウ', bodyPart: 'back' },
  { name: 'ラットプルダウン', bodyPart: 'back' },
  { name: 'フェイスプル', bodyPart: 'back' },

  // Legs (脚)
  { name: 'スクワット', bodyPart: 'legs' },
  { name: 'フロントスクワット', bodyPart: 'legs' },
  { name: 'ルーマニアンデッドリフト', bodyPart: 'legs' },
  { name: 'レッグプレス', bodyPart: 'legs' },
  { name: 'レッグエクステンション', bodyPart: 'legs' },
  { name: 'レッグカール', bodyPart: 'legs' },
  { name: 'ランジ', bodyPart: 'legs' },
  { name: 'ブルガリアンスクワット', bodyPart: 'legs' },
  { name: 'カーフレイズ', bodyPart: 'legs' },
  { name: 'ヒップスラスト', bodyPart: 'legs' },

  // Abs (腹筋)
  { name: 'プランク', bodyPart: 'abs' },
  { name: 'クランチ', bodyPart: 'abs' },
  { name: 'レッグレイズ', bodyPart: 'abs' },
  { name: 'ロシアンツイスト', bodyPart: 'abs' },
  { name: 'ケーブルクランチ', bodyPart: 'abs' },
  { name: 'アブローラー', bodyPart: 'abs' },
  { name: 'ハンギングニーレイズ', bodyPart: 'abs' },
  { name: 'サイドプランク', bodyPart: 'abs' },
]

export async function POST(request: Request) {
  try {
    // Check if exercises already exist
    const existingExercises = await prisma.exercise.findMany()

    if (existingExercises.length > 0) {
      return NextResponse.json({
        message: `データベースには既に${existingExercises.length}件の種目が存在します`,
        exercises: existingExercises.length,
      })
    }

    // Create exercises
    const created = []
    for (const exercise of exercises) {
      const ex = await prisma.exercise.create({
        data: exercise,
      })
      created.push(ex)
    }

    return NextResponse.json({
      message: `${created.length}件の種目を追加しました`,
      exercises: created,
    })
  } catch (error) {
    console.error('Error seeding exercises:', error)
    return NextResponse.json(
      { error: '種目データの追加に失敗しました', details: String(error) },
      { status: 500 }
    )
  }
}
