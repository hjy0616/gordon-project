-- CreateTable
CREATE TABLE "link_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "link_categories_name_key" ON "link_categories"("name");

-- CreateIndex
CREATE INDEX "link_categories_sort_order_idx" ON "link_categories"("sort_order");

-- CreateIndex
CREATE INDEX "links_category_id_sort_order_idx" ON "links"("category_id", "sort_order");

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "link_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
