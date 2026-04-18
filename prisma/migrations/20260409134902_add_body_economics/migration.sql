-- CreateTable
CREATE TABLE "body_mappings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organ_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_notes" (
    "id" TEXT NOT NULL,
    "mapping_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "body_mappings_user_id_idx" ON "body_mappings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "body_mappings_user_id_organ_id_key" ON "body_mappings"("user_id", "organ_id");

-- CreateIndex
CREATE INDEX "body_notes_mapping_id_idx" ON "body_notes"("mapping_id");

-- AddForeignKey
ALTER TABLE "body_mappings" ADD CONSTRAINT "body_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_notes" ADD CONSTRAINT "body_notes_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "body_mappings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
