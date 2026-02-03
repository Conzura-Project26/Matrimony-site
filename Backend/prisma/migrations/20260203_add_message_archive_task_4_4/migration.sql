-- Task 4.4: Conversation Management - Add Archive Support
-- Add archive tracking fields to messages table

ALTER TABLE "messages" 
ADD COLUMN "archived_by_sender_at" TIMESTAMP(3),
ADD COLUMN "archived_by_receiver_at" TIMESTAMP(3);

-- Create indexes for archive queries (performance optimization)
CREATE INDEX "idx_messages_archived_sender" ON "messages"("sender_id", "archived_by_sender_at") 
WHERE "archived_by_sender_at" IS NOT NULL;

CREATE INDEX "idx_messages_archived_receiver" ON "messages"("receiver_id", "archived_by_receiver_at") 
WHERE "archived_by_receiver_at" IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "messages"."archived_by_sender_at" IS 'Timestamp when sender archived this conversation (one-sided)';
COMMENT ON COLUMN "messages"."archived_by_receiver_at" IS 'Timestamp when receiver archived this conversation (one-sided)';
