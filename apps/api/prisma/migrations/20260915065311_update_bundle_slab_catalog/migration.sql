/*
  Warnings:

  - You are about to drop the column `purchasePrice` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `referencePrice` on the `Bundle` table. All the data in the column will be lost.
  - Added the required column `finishId` to the `Bundle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialClassificationId` to the `Bundle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialTypeId` to the `Bundle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualityId` to the `Bundle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SlabStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'INACTIVE');

-- AlterTable
ALTER TABLE "Bundle" DROP COLUMN "purchasePrice",
DROP COLUMN "referencePrice",
ADD COLUMN     "basePrice" DECIMAL(65,30),
ADD COLUMN     "finishId" INTEGER NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "materialClassificationId" INTEGER NOT NULL,
ADD COLUMN     "materialTypeId" INTEGER NOT NULL,
ADD COLUMN     "qualityId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "BundleImage" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Slab" (
    "id" SERIAL NOT NULL,
    "bundleId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "length" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "area" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "status" "SlabStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "Slab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlabImage" (
    "id" SERIAL NOT NULL,
    "slabId" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlabImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quality" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Quality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finish" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Finish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialType" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MaterialType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialClassification" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MaterialClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Slab_bundleId_idx" ON "Slab"("bundleId");

-- CreateIndex
CREATE INDEX "Slab_status_idx" ON "Slab"("status");

-- CreateIndex
CREATE INDEX "Slab_deletedAt_idx" ON "Slab"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Slab_bundleId_number_key" ON "Slab"("bundleId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "SlabImage_slabId_key" ON "SlabImage"("slabId");

-- CreateIndex
CREATE INDEX "SlabImage_slabId_idx" ON "SlabImage"("slabId");

-- CreateIndex
CREATE INDEX "Quality_companyId_idx" ON "Quality"("companyId");

-- CreateIndex
CREATE INDEX "Quality_deletedAt_idx" ON "Quality"("deletedAt");

-- CreateIndex
CREATE INDEX "Finish_companyId_idx" ON "Finish"("companyId");

-- CreateIndex
CREATE INDEX "Finish_deletedAt_idx" ON "Finish"("deletedAt");

-- CreateIndex
CREATE INDEX "MaterialType_companyId_idx" ON "MaterialType"("companyId");

-- CreateIndex
CREATE INDEX "MaterialType_deletedAt_idx" ON "MaterialType"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialType_companyId_name_key" ON "MaterialType"("companyId", "name");

-- CreateIndex
CREATE INDEX "MaterialClassification_companyId_idx" ON "MaterialClassification"("companyId");

-- CreateIndex
CREATE INDEX "MaterialClassification_deletedAt_idx" ON "MaterialClassification"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialClassification_companyId_name_key" ON "MaterialClassification"("companyId", "name");

-- CreateIndex
CREATE INDEX "Bundle_materialTypeId_idx" ON "Bundle"("materialTypeId");

-- CreateIndex
CREATE INDEX "Bundle_materialClassificationId_idx" ON "Bundle"("materialClassificationId");

-- CreateIndex
CREATE INDEX "Bundle_qualityId_idx" ON "Bundle"("qualityId");

-- CreateIndex
CREATE INDEX "Bundle_finishId_idx" ON "Bundle"("finishId");

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "MaterialType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_materialClassificationId_fkey" FOREIGN KEY ("materialClassificationId") REFERENCES "MaterialClassification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_qualityId_fkey" FOREIGN KEY ("qualityId") REFERENCES "Quality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_finishId_fkey" FOREIGN KEY ("finishId") REFERENCES "Finish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slab" ADD CONSTRAINT "Slab_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlabImage" ADD CONSTRAINT "SlabImage_slabId_fkey" FOREIGN KEY ("slabId") REFERENCES "Slab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quality" ADD CONSTRAINT "Quality_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finish" ADD CONSTRAINT "Finish_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialType" ADD CONSTRAINT "MaterialType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialClassification" ADD CONSTRAINT "MaterialClassification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
