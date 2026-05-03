-- CreateTable
CREATE TABLE "mind_maps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "emoji" TEXT,
    "description" TEXT,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mind_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mind_maps_user_id_updated_at_idx" ON "mind_maps"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "mind_maps_user_id_is_favorite_idx" ON "mind_maps"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "mind_maps_is_public_idx" ON "mind_maps"("is_public");

-- AddForeignKey
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
