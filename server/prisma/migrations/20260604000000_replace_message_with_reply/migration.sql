-- Drop old message table and enum
DROP TABLE "message";
DROP TYPE "MessageSender";

-- Create new SenderType enum
CREATE TYPE "SenderType" AS ENUM ('customer', 'agent', 'ai');

-- Rename columns on ticket table
ALTER TABLE "ticket" RENAME COLUMN "studentEmail" TO "senderEmail";
ALTER TABLE "ticket" RENAME COLUMN "studentName" TO "senderName";

-- Create Reply table
CREATE TABLE "reply" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reply" ADD CONSTRAINT "reply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply" ADD CONSTRAINT "reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
