-- Gym Buddies: Exercise data seed
-- Run this SQL in Supabase SQL Editor

INSERT INTO exercises (id, name, body_part, created_at) VALUES
-- Chest (胸)
(gen_random_uuid(), 'ベンチプレス', 'chest', NOW()),
(gen_random_uuid(), 'インクラインベンチプレス', 'chest', NOW()),
(gen_random_uuid(), 'デクラインベンチプレス', 'chest', NOW()),
(gen_random_uuid(), 'ダンベルプレス', 'chest', NOW()),
(gen_random_uuid(), 'インクラインダンベルプレス', 'chest', NOW()),
(gen_random_uuid(), 'ダンベルフライ', 'chest', NOW()),
(gen_random_uuid(), 'ケーブルクロスオーバー', 'chest', NOW()),
(gen_random_uuid(), '腕立て伏せ', 'chest', NOW()),
(gen_random_uuid(), 'ディップス（胸）', 'chest', NOW()),

-- Arms (腕)
(gen_random_uuid(), 'バーベルカール', 'arms', NOW()),
(gen_random_uuid(), 'ダンベルカール', 'arms', NOW()),
(gen_random_uuid(), 'ハンマーカール', 'arms', NOW()),
(gen_random_uuid(), 'プリチャーカール', 'arms', NOW()),
(gen_random_uuid(), 'ケーブルカール', 'arms', NOW()),
(gen_random_uuid(), 'トライセプスプッシュダウン', 'arms', NOW()),
(gen_random_uuid(), 'オーバーヘッドトライセプスエクステンション', 'arms', NOW()),
(gen_random_uuid(), 'スカルクラッシャー', 'arms', NOW()),
(gen_random_uuid(), 'ディップス（上腕三頭筋）', 'arms', NOW()),
(gen_random_uuid(), 'ナローグリップベンチプレス', 'arms', NOW()),

-- Shoulders (肩)
(gen_random_uuid(), 'ショルダープレス', 'shoulders', NOW()),
(gen_random_uuid(), 'ダンベルショルダープレス', 'shoulders', NOW()),
(gen_random_uuid(), 'サイドレイズ', 'shoulders', NOW()),
(gen_random_uuid(), 'フロントレイズ', 'shoulders', NOW()),
(gen_random_uuid(), 'リアデルトフライ', 'shoulders', NOW()),
(gen_random_uuid(), 'アーノルドプレス', 'shoulders', NOW()),
(gen_random_uuid(), 'アップライトロウ', 'shoulders', NOW()),
(gen_random_uuid(), 'シュラッグ', 'shoulders', NOW()),

-- Back (背中)
(gen_random_uuid(), 'デッドリフト', 'back', NOW()),
(gen_random_uuid(), '懸垂', 'back', NOW()),
(gen_random_uuid(), 'チンアップ', 'back', NOW()),
(gen_random_uuid(), 'ベントオーバーロウ', 'back', NOW()),
(gen_random_uuid(), 'Tバーロウ', 'back', NOW()),
(gen_random_uuid(), 'シーテッドケーブルロウ', 'back', NOW()),
(gen_random_uuid(), 'ワンアームダンベルロウ', 'back', NOW()),
(gen_random_uuid(), 'ラットプルダウン', 'back', NOW()),
(gen_random_uuid(), 'フェイスプル', 'back', NOW()),

-- Legs (脚)
(gen_random_uuid(), 'スクワット', 'legs', NOW()),
(gen_random_uuid(), 'フロントスクワット', 'legs', NOW()),
(gen_random_uuid(), 'ルーマニアンデッドリフト', 'legs', NOW()),
(gen_random_uuid(), 'レッグプレス', 'legs', NOW()),
(gen_random_uuid(), 'レッグエクステンション', 'legs', NOW()),
(gen_random_uuid(), 'レッグカール', 'legs', NOW()),
(gen_random_uuid(), 'ランジ', 'legs', NOW()),
(gen_random_uuid(), 'ブルガリアンスクワット', 'legs', NOW()),
(gen_random_uuid(), 'カーフレイズ', 'legs', NOW()),
(gen_random_uuid(), 'ヒップスラスト', 'legs', NOW()),

-- Abs (腹筋)
(gen_random_uuid(), 'プランク', 'abs', NOW()),
(gen_random_uuid(), 'クランチ', 'abs', NOW()),
(gen_random_uuid(), 'レッグレイズ', 'abs', NOW()),
(gen_random_uuid(), 'ロシアンツイスト', 'abs', NOW()),
(gen_random_uuid(), 'ケーブルクランチ', 'abs', NOW()),
(gen_random_uuid(), 'アブローラー', 'abs', NOW()),
(gen_random_uuid(), 'ハンギングニーレイズ', 'abs', NOW()),
(gen_random_uuid(), 'サイドプランク', 'abs', NOW());
