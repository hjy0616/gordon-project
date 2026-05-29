-- AlterTable
ALTER TABLE "links" ADD COLUMN     "episodes" JSONB,
ALTER COLUMN "author" DROP NOT NULL;
