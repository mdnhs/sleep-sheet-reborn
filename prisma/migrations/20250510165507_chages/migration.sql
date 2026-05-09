/*
  Warnings:

  - Added the required column `email` to the `OTPVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OTPVerification" DROP CONSTRAINT "OTPVerification_userId_fkey";

-- AlterTable
ALTER TABLE "OTPVerification" ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "OTPVerification_email_idx" ON "OTPVerification"("email");

-- AddForeignKey
ALTER TABLE "OTPVerification" ADD CONSTRAINT "OTPVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
