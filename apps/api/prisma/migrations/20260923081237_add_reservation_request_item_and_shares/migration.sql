-- CreateEnum
CREATE TYPE "ReservationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "ReservationRequest" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "status" "ReservationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReservationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationRequestItem" (
    "id" SERIAL NOT NULL,
    "reservationRequestId" INTEGER NOT NULL,
    "slabId" INTEGER NOT NULL,

    CONSTRAINT "ReservationRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" "ShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareItem" (
    "id" SERIAL NOT NULL,
    "shareId" INTEGER NOT NULL,
    "bundleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationRequest_companyId_idx" ON "ReservationRequest"("companyId");

-- CreateIndex
CREATE INDEX "ReservationRequest_requesterId_idx" ON "ReservationRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ReservationRequest_status_idx" ON "ReservationRequest"("status");

-- CreateIndex
CREATE INDEX "ReservationRequestItem_slabId_idx" ON "ReservationRequestItem"("slabId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationRequestItem_reservationRequestId_slabId_key" ON "ReservationRequestItem"("reservationRequestId", "slabId");

-- CreateIndex
CREATE UNIQUE INDEX "Share_token_key" ON "Share"("token");

-- CreateIndex
CREATE INDEX "Share_companyId_idx" ON "Share"("companyId");

-- CreateIndex
CREATE INDEX "Share_createdById_idx" ON "Share"("createdById");

-- CreateIndex
CREATE INDEX "Share_status_idx" ON "Share"("status");

-- CreateIndex
CREATE INDEX "Share_expiresAt_idx" ON "Share"("expiresAt");

-- CreateIndex
CREATE INDEX "Share_deletedAt_idx" ON "Share"("deletedAt");

-- CreateIndex
CREATE INDEX "ShareItem_shareId_idx" ON "ShareItem"("shareId");

-- CreateIndex
CREATE INDEX "ShareItem_bundleId_idx" ON "ShareItem"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareItem_shareId_bundleId_key" ON "ShareItem"("shareId", "bundleId");

-- AddForeignKey
ALTER TABLE "ReservationRequest" ADD CONSTRAINT "ReservationRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequest" ADD CONSTRAINT "ReservationRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequestItem" ADD CONSTRAINT "ReservationRequestItem_reservationRequestId_fkey" FOREIGN KEY ("reservationRequestId") REFERENCES "ReservationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationRequestItem" ADD CONSTRAINT "ReservationRequestItem_slabId_fkey" FOREIGN KEY ("slabId") REFERENCES "Slab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareItem" ADD CONSTRAINT "ShareItem_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareItem" ADD CONSTRAINT "ShareItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
