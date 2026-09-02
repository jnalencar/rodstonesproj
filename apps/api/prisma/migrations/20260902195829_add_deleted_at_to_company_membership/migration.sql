-- AlterTable
ALTER TABLE "CompanyMembership" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UserRole_membershipId_idx" ON "UserRole"("membershipId");
