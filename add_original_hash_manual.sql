-- Execute this SQL manually in your PostgreSQL database to add the originalHash field

-- Step 1: Check if the column already exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'SignedDocument' AND column_name = 'originalHash';

-- Step 2: Add the originalHash column if it doesn't exist
ALTER TABLE "SignedDocument" ADD COLUMN IF NOT EXISTS "originalHash" TEXT;

-- Step 3: Create an index on originalHash for faster lookups
CREATE INDEX IF NOT EXISTS "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");

-- Step 4: Verify the column was added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'SignedDocument' AND column_name = 'originalHash';
