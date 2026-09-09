/*
  Warnings:

  - The values [THERODSTONES] on the enum `PartnerType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[companyId]` on the table `Partner` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PartnerType_new" AS ENUM ('RESELLER', 'INTEGRATOR', 'OTHER');
ALTER TABLE "Partner" ALTER COLUMN "type" TYPE "PartnerType_new" USING ("type"::text::"PartnerType_new");
ALTER TYPE "PartnerType" RENAME TO "PartnerType_old";
ALTER TYPE "PartnerType_new" RENAME TO "PartnerType";
DROP TYPE "public"."PartnerType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "companyId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Partner_companyId_key" ON "Partner"("companyId");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
