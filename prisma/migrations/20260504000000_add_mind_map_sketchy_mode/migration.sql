-- Add sketchy_mode flag to mind_maps. Existing rows default to false (clean bezier).
ALTER TABLE "mind_maps" ADD COLUMN "sketchy_mode" BOOLEAN NOT NULL DEFAULT false;
