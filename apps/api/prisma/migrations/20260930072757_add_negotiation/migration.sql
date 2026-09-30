/*
  Warnings:

  - A unique constraint covering the columns `[accessTokenHash]` on the table `ReservationRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('IN_NEGOTIATION', 'AWAITING_BOOKING');

-- AlterTable
ALTER TABLE "ReservationRequest" ADD COLUMN     "accessTokenHash" TEXT;

-- CreateTable
CREATE TABLE "Negotiation" (
    "id" SERIAL NOT NULL,
    "reservationRequestId" INTEGER NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'IN_NEGOTIATION',
    "paymentTerms" TEXT,
    "portOfLoading" TEXT,
    "portOfDestination" TEXT,
    "shippingMethod" TEXT,
    "incoterm" TEXT,
    "negotiationClosedAt" TIMESTAMP(3),
    "containerType" TEXT,
    "deliveryTime" TEXT,
    "truckingFee" DECIMAL(65,30),
    "oceanFreight" DECIMAL(65,30),
    "invoice" TEXT,
    "packingInfo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationFile" (
    "id" SERIAL NOT NULL,
    "negotiationId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Negotiation_reservationRequestId_key" ON "Negotiation"("reservationRequestId");

-- CreateIndex
CREATE INDEX "NegotiationFile_negotiationId_idx" ON "NegotiationFile"("negotiationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationRequest_accessTokenHash_key" ON "ReservationRequest"("accessTokenHash");

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_reservationRequestId_fkey" FOREIGN KEY ("reservationRequestId") REFERENCES "ReservationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationFile" ADD CONSTRAINT "NegotiationFile_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
