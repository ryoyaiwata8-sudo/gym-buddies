-- Schema update script
-- Run this FIRST in Supabase SQL Editor

-- Step 1: Add status column to follows table
ALTER TABLE follows
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Step 2: Add updatedAt column to follows table
ALTER TABLE follows
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Add userId column to exercises table (for custom exercises)
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Step 4: Add isCustom column to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN DEFAULT false;

-- Step 5: Add followId column to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS "followId" TEXT;

-- Verification: Check that all columns were added
SELECT
  'follows table columns:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'follows'
  AND column_name IN ('status', 'updatedAt')
UNION ALL
SELECT
  'exercises table columns:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'exercises'
  AND column_name IN ('userId', 'isCustom')
UNION ALL
SELECT
  'notifications table columns:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name = 'followId';
