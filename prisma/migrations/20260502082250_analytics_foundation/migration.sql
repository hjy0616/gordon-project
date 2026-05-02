-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "signup_referer" TEXT,
ADD COLUMN     "signup_source" TEXT;

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "duration_sec" INTEGER,
    "user_agent" TEXT,
    "referer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "path" TEXT,
    "props" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_status_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_status" "UserStatus",
    "to_status" "UserStatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'percent',
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "current_value" DOUBLE PRECISION,
    "payload" JSONB,
    "last_computed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_sessions_user_id_started_at_idx" ON "user_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "user_sessions_last_seen_at_idx" ON "user_sessions"("last_seen_at");

-- CreateIndex
CREATE INDEX "user_events_type_created_at_idx" ON "user_events"("type", "created_at");

-- CreateIndex
CREATE INDEX "user_events_user_id_created_at_idx" ON "user_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_events_created_at_idx" ON "user_events"("created_at");

-- CreateIndex
CREATE INDEX "user_status_logs_user_id_created_at_idx" ON "user_status_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_status_logs_to_status_created_at_idx" ON "user_status_logs"("to_status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_key_key" ON "kpis"("key");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_status_logs" ADD CONSTRAINT "user_status_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
