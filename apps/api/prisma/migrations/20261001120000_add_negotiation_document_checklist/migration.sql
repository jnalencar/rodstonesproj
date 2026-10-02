ALTER TABLE "Negotiation"
ADD COLUMN "invoiceUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "packingListUploaded" BOOLEAN NOT NULL DEFAULT false;