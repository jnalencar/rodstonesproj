/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `ReservationRequest` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `ReservationRequest` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `ReservationRequest` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `ReservationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shareId` to the `ReservationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ReservationRequest" DROP CONSTRAINT "ReservationRequest_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ReservationRequest" DROP CONSTRAINT "ReservationRequest_requesterId_fkey";

-- DropIndex
DROP INDEX "ReservationRequest_requesterId_idx";

-- AlterTable
ALTER TABLE "ReservationRequest" DROP COLUMN "deletedAt",
DROP COLUMN "notes",
DROP COLUMN "requesterId",
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "shareId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ReservationRequestItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ReservationRequest_shareId_idx" ON "ReservationRequest"("shareId");

-- AddForeignKey
ALTER TABLE "ReservationRequest" ADD CONSTRAINT "ReservationRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequest" ADD CONSTRAINT "ReservationRequest_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
