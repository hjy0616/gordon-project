-- CreateEnum
CREATE TYPE "FlowType" AS ENUM ('fdi', 'portfolio', 'trade');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('ally', 'rival');

-- CreateEnum
CREATE TYPE "SurvivalTier" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'MODERATE', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "iso_a3" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "continent_tag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_edits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "iso_a3" TEXT NOT NULL,
    "population" DOUBLE PRECISION,
    "gdp" DOUBLE PRECISION,
    "gni" DOUBLE PRECISION,
    "gni_per_capita" DOUBLE PRECISION,
    "national_debt" DOUBLE PRECISION,
    "key_industries" TEXT[],
    "tech_capability" TEXT,
    "military_rank" INTEGER,
    "core_capabilities" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_flows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_iso" TEXT NOT NULL,
    "to_iso" TEXT NOT NULL,
    "from_coords" JSONB NOT NULL,
    "to_coords" JSONB NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "type" "FlowType" NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_relations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_iso" TEXT NOT NULL,
    "to_iso" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_districts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name_ko" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "tier" "SurvivalTier" NOT NULL,
    "tier_reason" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "criteria" JSONB NOT NULL,
    "haas_scores" JSONB NOT NULL,
    "rights_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "district_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district_edits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "haas_scores" JSONB,
    "radar_scores" JSONB,
    "usage_sim_inputs" JSONB,
    "revenue_inputs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "district_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "district_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "name_ko" TEXT,
    "name_en" TEXT,
    "region" TEXT,
    "tier" "SurvivalTier",
    "tier_reason" TEXT,
    "criteria" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "district_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "adoption_rate" INTEGER NOT NULL DEFAULT 50,
    "deleted_mock_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "country_notes_user_id_idx" ON "country_notes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "country_notes_user_id_iso_a3_key" ON "country_notes"("user_id", "iso_a3");

-- CreateIndex
CREATE INDEX "country_edits_user_id_idx" ON "country_edits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "country_edits_user_id_iso_a3_key" ON "country_edits"("user_id", "iso_a3");

-- CreateIndex
CREATE INDEX "capital_flows_user_id_idx" ON "capital_flows"("user_id");

-- CreateIndex
CREATE INDEX "capital_flows_user_id_from_iso_idx" ON "capital_flows"("user_id", "from_iso");

-- CreateIndex
CREATE INDEX "capital_flows_user_id_to_iso_idx" ON "capital_flows"("user_id", "to_iso");

-- CreateIndex
CREATE INDEX "country_relations_user_id_idx" ON "country_relations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "country_relations_user_id_from_iso_to_iso_key" ON "country_relations"("user_id", "from_iso", "to_iso");

-- CreateIndex
CREATE INDEX "custom_districts_user_id_idx" ON "custom_districts"("user_id");

-- CreateIndex
CREATE INDEX "district_notes_user_id_idx" ON "district_notes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "district_notes_user_id_district_id_key" ON "district_notes"("user_id", "district_id");

-- CreateIndex
CREATE INDEX "district_edits_user_id_idx" ON "district_edits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "district_edits_user_id_district_id_key" ON "district_edits"("user_id", "district_id");

-- CreateIndex
CREATE INDEX "district_overrides_user_id_idx" ON "district_overrides"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "district_overrides_user_id_district_id_key" ON "district_overrides"("user_id", "district_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_notes" ADD CONSTRAINT "country_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_edits" ADD CONSTRAINT "country_edits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_flows" ADD CONSTRAINT "capital_flows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_relations" ADD CONSTRAINT "country_relations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_districts" ADD CONSTRAINT "custom_districts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "district_notes" ADD CONSTRAINT "district_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "district_edits" ADD CONSTRAINT "district_edits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "district_overrides" ADD CONSTRAINT "district_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
