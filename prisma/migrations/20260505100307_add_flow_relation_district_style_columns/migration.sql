-- AlterTable
ALTER TABLE "capital_flows" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#e67e22',
ADD COLUMN     "line_style" TEXT NOT NULL DEFAULT 'dashed';

-- AlterTable
ALTER TABLE "country_relations" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3b82f6',
ADD COLUMN     "line_style" TEXT NOT NULL DEFAULT 'solid';

-- AlterTable
ALTER TABLE "custom_districts" ADD COLUMN     "color" TEXT,
ADD COLUMN     "matched_district_id" TEXT;
