-- CreateTable
CREATE TABLE "finance_portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rows" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_portfolios_user_id_key" ON "finance_portfolios"("user_id");

-- AddForeignKey
ALTER TABLE "finance_portfolios" ADD CONSTRAINT "finance_portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
