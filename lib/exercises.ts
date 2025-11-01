export interface Exercise {
  id: string
  name: string
  bodyPart: string
}

// 種目データをクライアント側に持つことで、高速な読み込みを実現
export const EXERCISES: Exercise[] = [
  // Chest (胸)
  { id: 'bench-press', name: 'ベンチプレス', bodyPart: 'chest' },
  { id: 'incline-bench-press', name: 'インクラインベンチプレス', bodyPart: 'chest' },
  { id: 'decline-bench-press', name: 'デクラインベンチプレス', bodyPart: 'chest' },
  { id: 'dumbbell-press', name: 'ダンベルプレス', bodyPart: 'chest' },
  { id: 'incline-dumbbell-press', name: 'インクラインダンベルプレス', bodyPart: 'chest' },
  { id: 'dumbbell-fly', name: 'ダンベルフライ', bodyPart: 'chest' },
  { id: 'cable-crossover', name: 'ケーブルクロスオーバー', bodyPart: 'chest' },
  { id: 'push-up', name: '腕立て伏せ', bodyPart: 'chest' },
  { id: 'chest-dips', name: 'ディップス（胸）', bodyPart: 'chest' },

  // Arms (腕)
  { id: 'barbell-curl', name: 'バーベルカール', bodyPart: 'arms' },
  { id: 'dumbbell-curl', name: 'ダンベルカール', bodyPart: 'arms' },
  { id: 'hammer-curl', name: 'ハンマーカール', bodyPart: 'arms' },
  { id: 'preacher-curl', name: 'プリチャーカール', bodyPart: 'arms' },
  { id: 'cable-curl', name: 'ケーブルカール', bodyPart: 'arms' },
  { id: 'triceps-pushdown', name: 'トライセプスプッシュダウン', bodyPart: 'arms' },
  { id: 'overhead-extension', name: 'オーバーヘッドトライセプスエクステンション', bodyPart: 'arms' },
  { id: 'skull-crusher', name: 'スカルクラッシャー', bodyPart: 'arms' },
  { id: 'triceps-dips', name: 'ディップス（上腕三頭筋）', bodyPart: 'arms' },
  { id: 'close-grip-bench', name: 'ナローグリップベンチプレス', bodyPart: 'arms' },

  // Shoulders (肩)
  { id: 'shoulder-press', name: 'ショルダープレス', bodyPart: 'shoulders' },
  { id: 'dumbbell-shoulder-press', name: 'ダンベルショルダープレス', bodyPart: 'shoulders' },
  { id: 'lateral-raise', name: 'サイドレイズ', bodyPart: 'shoulders' },
  { id: 'front-raise', name: 'フロントレイズ', bodyPart: 'shoulders' },
  { id: 'rear-delt-fly', name: 'リアデルトフライ', bodyPart: 'shoulders' },
  { id: 'arnold-press', name: 'アーノルドプレス', bodyPart: 'shoulders' },
  { id: 'upright-row', name: 'アップライトロウ', bodyPart: 'shoulders' },
  { id: 'shrug', name: 'シュラッグ', bodyPart: 'shoulders' },

  // Back (背中)
  { id: 'deadlift', name: 'デッドリフト', bodyPart: 'back' },
  { id: 'pull-up', name: '懸垂', bodyPart: 'back' },
  { id: 'chin-up', name: 'チンアップ', bodyPart: 'back' },
  { id: 'bent-over-row', name: 'ベントオーバーロウ', bodyPart: 'back' },
  { id: 't-bar-row', name: 'Tバーロウ', bodyPart: 'back' },
  { id: 'seated-cable-row', name: 'シーテッドケーブルロウ', bodyPart: 'back' },
  { id: 'one-arm-row', name: 'ワンアームダンベルロウ', bodyPart: 'back' },
  { id: 'lat-pulldown', name: 'ラットプルダウン', bodyPart: 'back' },
  { id: 'face-pull', name: 'フェイスプル', bodyPart: 'back' },

  // Legs (脚)
  { id: 'squat', name: 'スクワット', bodyPart: 'legs' },
  { id: 'front-squat', name: 'フロントスクワット', bodyPart: 'legs' },
  { id: 'romanian-deadlift', name: 'ルーマニアンデッドリフト', bodyPart: 'legs' },
  { id: 'leg-press', name: 'レッグプレス', bodyPart: 'legs' },
  { id: 'leg-extension', name: 'レッグエクステンション', bodyPart: 'legs' },
  { id: 'leg-curl', name: 'レッグカール', bodyPart: 'legs' },
  { id: 'lunge', name: 'ランジ', bodyPart: 'legs' },
  { id: 'bulgarian-squat', name: 'ブルガリアンスクワット', bodyPart: 'legs' },
  { id: 'calf-raise', name: 'カーフレイズ', bodyPart: 'legs' },
  { id: 'hip-thrust', name: 'ヒップスラスト', bodyPart: 'legs' },

  // Abs (腹筋)
  { id: 'plank', name: 'プランク', bodyPart: 'abs' },
  { id: 'crunch', name: 'クランチ', bodyPart: 'abs' },
  { id: 'leg-raise', name: 'レッグレイズ', bodyPart: 'abs' },
  { id: 'russian-twist', name: 'ロシアンツイスト', bodyPart: 'abs' },
  { id: 'cable-crunch', name: 'ケーブルクランチ', bodyPart: 'abs' },
  { id: 'ab-roller', name: 'アブローラー', bodyPart: 'abs' },
  { id: 'hanging-knee-raise', name: 'ハンギングニーレイズ', bodyPart: 'abs' },
  { id: 'side-plank', name: 'サイドプランク', bodyPart: 'abs' },
]

export const BODY_PARTS = [
  { key: 'all', label: 'ALL' },
  { key: 'chest', label: '胸' },
  { key: 'arms', label: '腕' },
  { key: 'shoulders', label: '肩' },
  { key: 'back', label: '背中' },
  { key: 'legs', label: '脚' },
  { key: 'abs', label: '腹筋' },
]

export function getExercisesByBodyPart(bodyPart: string): Exercise[] {
  if (bodyPart === 'all') {
    return EXERCISES
  }
  return EXERCISES.filter(ex => ex.bodyPart === bodyPart)
}

export function searchExercises(query: string, bodyPart?: string): Exercise[] {
  let filtered = bodyPart && bodyPart !== 'all'
    ? getExercisesByBodyPart(bodyPart)
    : EXERCISES

  if (query) {
    const lowerQuery = query.toLowerCase()
    filtered = filtered.filter(ex =>
      ex.name.toLowerCase().includes(lowerQuery)
    )
  }

  return filtered
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(ex => ex.id === id)
}
