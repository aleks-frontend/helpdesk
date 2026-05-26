-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('general', 'technical', 'refund');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('ai', 'agent', 'student');

-- CreateTable
CREATE TABLE "ticket" (
    "id" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "category" "TicketCategory" NOT NULL DEFAULT 'general',
    "assignedAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
