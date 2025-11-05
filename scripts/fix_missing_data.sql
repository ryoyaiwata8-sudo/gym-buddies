-- Fix missing data after schema changes

-- 1. Update existing Follow records to have 'accepted' status
-- This restores existing friendships
UPDATE follows
SET status = 'accepted',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE status IS NULL OR status = '';

-- 2. Add default values for Exercise table new fields
-- Set existing exercises as non-custom (preset exercises)
UPDATE exercises
SET "userId" = NULL,
    "isCustom" = false
WHERE "userId" IS NULL AND "isCustom" IS NULL;

-- Note: Run seed command to restore exercise data if exercises table is empty
-- npm run db:seed
