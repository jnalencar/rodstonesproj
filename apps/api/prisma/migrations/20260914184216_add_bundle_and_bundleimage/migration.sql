-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('PENDING', 'AVAILABLE', 'RESERVED', 'SOLD', 'INACTIVE');

-- CreateTable
CREATE TABLE "Bundle" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "block" TEXT,
    "bundleCode" TEXT NOT NULL,
    "thickness" DECIMAL(65,30),
    "weight" DECIMAL(65,30),
    "referencePrice" DECIMAL(65,30),
    "purchasePrice" DECIMAL(65,30),
    "status" "BundleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleImage" (
    "id" SERIAL NOT NULL,
    "bundleId" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bundle_companyId_idx" ON "Bundle"("companyId");

-- CreateIndex
CREATE INDEX "Bundle_materialId_idx" ON "Bundle"("materialId");

-- CreateIndex
CREATE INDEX "Bundle_status_idx" ON "Bundle"("status");

-- CreateIndex
CREATE INDEX "Bundle_deletedAt_idx" ON "Bundle"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_companyId_bundleCode_key" ON "Bundle"("companyId", "bundleCode");

-- CreateIndex
CREATE UNIQUE INDEX "BundleImage_bundleId_key" ON "BundleImage"("bundleId");

-- CreateIndex
CREATE INDEX "BundleImage_bundleId_idx" ON "BundleImage"("bundleId");

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleImage" ADD CONSTRAINT "BundleImage_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
