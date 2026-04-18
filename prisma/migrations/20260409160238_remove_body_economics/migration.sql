/*
  Warnings:

  - You are about to drop the `body_mappings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `body_notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "body_mappings" DROP CONSTRAINT "body_mappings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "body_notes" DROP CONSTRAINT "body_notes_mapping_id_fkey";

-- DropTable
DROP TABLE "body_mappings";

-- DropTable
DROP TABLE "body_notes";
