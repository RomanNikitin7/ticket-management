-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'agent');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('general_question', 'technical_question', 'refund_request');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'agent',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "category" "TicketCategory",
    "summary" TEXT,
    "assigneeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_ticketId_idx" ON "Message"("ticketId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
