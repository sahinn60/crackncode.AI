-- CreateEnum
CREATE TYPE "BrowserToolStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "BrowserConnectionStatus" AS ENUM ('PENDING', 'CONNECTING', 'CONNECTED', 'EXPIRED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "BrowserExecutionStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'timeout', 'canceled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminLogAction" ADD VALUE 'browser_tool_created';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_tool_updated';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_tool_deleted';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_tool_enabled';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_tool_disabled';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_connection_started';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_connection_completed';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_connection_disconnected';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_connection_verified';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_execution_failed';
ALTER TYPE "AdminLogAction" ADD VALUE 'browser_session_expired';

-- CreateTable
CREATE TABLE "browser_tools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ctaText" TEXT NOT NULL DEFAULT 'Use Tool',
    "status" "BrowserToolStatus" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "inputSchema" JSONB NOT NULL DEFAULT '{}',
    "creditCost" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "browser_tool_connections" (
    "id" TEXT NOT NULL,
    "browserToolId" TEXT NOT NULL,
    "status" "BrowserConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "encryptedSessionState" TEXT,
    "encryptionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_tool_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "browser_tool_executions" (
    "id" TEXT NOT NULL,
    "browserToolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BrowserExecutionStatus" NOT NULL DEFAULT 'queued',
    "input" JSONB NOT NULL,
    "result" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditTxId" TEXT,
    "idempotencyKey" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_tool_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "browser_tools_slug_key" ON "browser_tools"("slug");

-- CreateIndex
CREATE INDEX "browser_tools_slug_idx" ON "browser_tools"("slug");

-- CreateIndex
CREATE INDEX "browser_tools_status_idx" ON "browser_tools"("status");

-- CreateIndex
CREATE INDEX "browser_tools_featured_idx" ON "browser_tools"("featured");

-- CreateIndex
CREATE INDEX "browser_tools_deletedAt_idx" ON "browser_tools"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "browser_tool_connections_browserToolId_key" ON "browser_tool_connections"("browserToolId");

-- CreateIndex
CREATE INDEX "browser_tool_connections_status_idx" ON "browser_tool_connections"("status");

-- CreateIndex
CREATE INDEX "browser_tool_connections_browserToolId_idx" ON "browser_tool_connections"("browserToolId");

-- CreateIndex
CREATE UNIQUE INDEX "browser_tool_executions_idempotencyKey_key" ON "browser_tool_executions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "browser_tool_executions_browserToolId_idx" ON "browser_tool_executions"("browserToolId");

-- CreateIndex
CREATE INDEX "browser_tool_executions_userId_idx" ON "browser_tool_executions"("userId");

-- CreateIndex
CREATE INDEX "browser_tool_executions_status_idx" ON "browser_tool_executions"("status");

-- CreateIndex
CREATE INDEX "browser_tool_executions_idempotencyKey_idx" ON "browser_tool_executions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "browser_tool_executions_createdAt_idx" ON "browser_tool_executions"("createdAt");

-- AddForeignKey
ALTER TABLE "browser_tools" ADD CONSTRAINT "browser_tools_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_tool_connections" ADD CONSTRAINT "browser_tool_connections_browserToolId_fkey" FOREIGN KEY ("browserToolId") REFERENCES "browser_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_tool_executions" ADD CONSTRAINT "browser_tool_executions_browserToolId_fkey" FOREIGN KEY ("browserToolId") REFERENCES "browser_tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_tool_executions" ADD CONSTRAINT "browser_tool_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
