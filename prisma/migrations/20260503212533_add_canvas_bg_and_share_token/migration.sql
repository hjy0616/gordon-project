-- AlterTable
ALTER TABLE "mind_maps" ADD COLUMN "canvas_background" TEXT NOT NULL DEFAULT 'dots';
ALTER TABLE "mind_maps" ADD COLUMN "canvas_background_color" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "mind_maps" ADD COLUMN "share_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mind_maps_share_token_key" ON "mind_maps"("share_token");
