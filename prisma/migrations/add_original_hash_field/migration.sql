-- Add originalHash field to SignedDocument table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'SignedDocument' AND column_name = 'originalHash'
    ) THEN
        ALTER TABLE "SignedDocument" ADD COLUMN "originalHash" TEXT;
        
        -- Add index on originalHash for faster lookups
        CREATE INDEX "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");
    END IF;
END $$;
