/*
  Warnings:

  - You are about to drop the column `customerEmail` on the `Share` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `Share` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `Share` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Share" DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "customerPhone",
ADD COLUMN     "clientId" INTEGER;

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_deletedAt_idx" ON "Client"("deletedAt");

-- CreateIndex
CREATE INDEX "Share_clientId_idx" ON "Share"("clientId");

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
