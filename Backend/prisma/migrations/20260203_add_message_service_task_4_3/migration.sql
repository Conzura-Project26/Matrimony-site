-- Migration: Add Message Service (Task 4.3)
-- Date: 2026-02-03
-- Description: Add messaging functionality with read receipts and soft delete support

-- AlterTable: messages
-- Add new columns for message content, read receipts, and soft delete
ALTER TABLE "messages" DROP COLUMN IF EXISTS "message";
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "content" VARCHAR(1000) NOT NULL;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_by_sender_at" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_by_receiver_at" TIMESTAMP(3);

-- AddForeignKey: messages -> users (sender)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" 
      FOREIGN KEY ("sender_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: messages -> users (receiver)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_receiver_id_fkey'
  ) THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" 
      FOREIGN KEY ("receiver_id") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex: messages (sender_id, sent_at)
CREATE INDEX IF NOT EXISTS "messages_sender_id_sent_at_idx" 
  ON "messages"("sender_id", "sent_at");

-- CreateIndex: messages (receiver_id, read_at)
CREATE INDEX IF NOT EXISTS "messages_receiver_id_read_at_idx" 
  ON "messages"("receiver_id", "read_at");

-- CreateIndex: messages (sender_id, receiver_id, sent_at)
CREATE INDEX IF NOT EXISTS "messages_sender_id_receiver_id_sent_at_idx" 
  ON "messages"("sender_id", "receiver_id", "sent_at");
