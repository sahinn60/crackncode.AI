-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('draft', 'published', 'archived');

-- AlterTable
ALTER TABLE "ai_tools" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "ctaText" TEXT NOT NULL DEFAULT 'Buy Now',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BDT',
ADD COLUMN     "destinationUrl" TEXT,
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "status" "ToolStatus" NOT NULL DEFAULT 'draft';

-- CreateIndex
CREATE INDEX "ai_tools_status_idx" ON "ai_tools"("status");
