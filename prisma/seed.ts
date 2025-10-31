import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

async function main() {
  console.log('Start seeding...')

  // Clear existing exercises
  await prisma.exercise.deleteMany({})

  // Create exercises
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise,
    })
  }

  console.log(`Seeded ${exercises.length} exercises`)
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
