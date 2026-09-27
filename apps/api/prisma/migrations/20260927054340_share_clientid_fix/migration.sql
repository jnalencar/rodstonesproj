/*
  Warnings:

  - Made the column `clientId` on table `Share` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Share" ALTER COLUMN "clientId" SET NOT NULL;
