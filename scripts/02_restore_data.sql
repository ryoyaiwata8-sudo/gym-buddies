-- Data restoration script
-- Run this SECOND (after 01_update_schema.sql) in Supabase SQL Editor

-- Step 1: Fix existing Follow records to have 'accepted' status
-- This restores your friendships
UPDATE follows
SET status = 'accepted',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE status IS NULL OR status = '' OR status = 'pending';

-- Step 2: Clear all exercises (both broken and working)
DELETE FROM exercises;

-- Step 3: Restore all preset exercises
-- Chest (胸)
INSERT INTO exercises (id, name, "bodyPart", "userId", "isCustom", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'ベンチプレス', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'インクラインベンチプレス', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'デクラインベンチプレス', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ダンベルプレス', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'インクラインダンベルプレス', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ダンベルフライ', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ケーブルクロスオーバー', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), '腕立て伏せ', 'chest', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ディップス（胸）', 'chest', NULL, false, NOW(), NOW()),

-- Arms (腕)
(gen_random_uuid(), 'バーベルカール', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ダンベルカール', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ハンマーカール', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'プリチャーカール', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ケーブルカール', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'トライセプスプッシュダウン', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'オーバーヘッドトライセプスエクステンション', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'スカルクラッシャー', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ディップス（上腕三頭筋）', 'arms', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ナローグリップベンチプレス', 'arms', NULL, false, NOW(), NOW()),

-- Shoulders (肩)
(gen_random_uuid(), 'ショルダープレス', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ダンベルショルダープレス', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'サイドレイズ', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'フロントレイズ', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'リアデルトフライ', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'アーノルドプレス', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'アップライトロウ', 'shoulders', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'シュラッグ', 'shoulders', NULL, false, NOW(), NOW()),

-- Back (背中)
(gen_random_uuid(), 'デッドリフト', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), '懸垂', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'チンアップ', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ベントオーバーロウ', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'Tバーロウ', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'シーテッドケーブルロウ', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ワンアームダンベルロウ', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ラットプルダウン', 'back', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'フェイスプル', 'back', NULL, false, NOW(), NOW()),

-- Legs (脚)
(gen_random_uuid(), 'スクワット', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'フロントスクワット', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ルーマニアンデッドリフト', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'レッグプレス', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'レッグエクステンション', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'レッグカール', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ランジ', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ブルガリアンスクワット', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'カーフレイズ', 'legs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ヒップスラスト', 'legs', NULL, false, NOW(), NOW()),

-- Abs (腹筋)
(gen_random_uuid(), 'プランク', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'クランチ', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'レッグレイズ', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ロシアンツイスト', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ケーブルクランチ', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'アブローラー', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'ハンギングニーレイズ', 'abs', NULL, false, NOW(), NOW()),
(gen_random_uuid(), 'サイドプランク', 'abs', NULL, false, NOW(), NOW());

-- Verification: Check restored data
SELECT 'Follows restored:' as info, COUNT(*) as count FROM follows WHERE status = 'accepted'
UNION ALL
SELECT 'Exercises restored:' as info, COUNT(*) as count FROM exercises WHERE "isCustom" = false;
