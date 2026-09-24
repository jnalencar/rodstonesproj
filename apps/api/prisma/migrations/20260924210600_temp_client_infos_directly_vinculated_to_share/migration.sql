/*
  Warnings:

  - You are about to drop the column `customerEmail` on the `ReservationRequest` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `ReservationRequest` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `ReservationRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReservationRequest" DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "customerPhone";

-- AlterTable
ALTER TABLE "Share" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT;
