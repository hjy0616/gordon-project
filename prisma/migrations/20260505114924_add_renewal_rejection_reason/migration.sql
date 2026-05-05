-- AlterTable
ALTER TABLE "users" ADD COLUMN     "renewal_rejected_at" TIMESTAMP(3),
ADD COLUMN     "renewal_rejection_reason" TEXT;
