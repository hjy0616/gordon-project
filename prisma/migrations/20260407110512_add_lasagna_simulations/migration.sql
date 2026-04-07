-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('in_progress', 'completed');

-- CreateTable
CREATE TABLE "lasagna_simulations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_description" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" "SimulationStatus" NOT NULL DEFAULT 'in_progress',
    "steps" JSONB NOT NULL DEFAULT '{}',
    "crowd_analysis" JSONB NOT NULL DEFAULT '{"emotion":"","action":"","narrative":""}',
    "my_analysis" JSONB NOT NULL DEFAULT '{"structure":"","action":"","reason":""}',
    "flow_nodes" JSONB NOT NULL DEFAULT '[]',
    "flow_edges" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lasagna_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lasagna_simulations_user_id_idx" ON "lasagna_simulations"("user_id");

-- AddForeignKey
ALTER TABLE "lasagna_simulations" ADD CONSTRAINT "lasagna_simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
