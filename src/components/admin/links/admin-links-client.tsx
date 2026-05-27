"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminLinkCategories } from "@/lib/queries/use-admin-link-categories";
import { AdminLinksList } from "./admin-links-list";
import { AdminLinkCategories } from "./admin-link-categories";

export function AdminLinksClient() {
  const [active, setActive] = useState<"links" | "categories">("links");
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useAdminLinkCategories();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold">Links 관리</h1>

      <Tabs value={active} onValueChange={(v) => setActive(v as "links" | "categories")}>
        <TabsList>
          <TabsTrigger value="links">링크 목록</TabsTrigger>
          <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="mt-4">
          {active === "links" ? <AdminLinksList categories={categories} /> : null}
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          {active === "categories" ? (
            <AdminLinkCategories
              categories={categories}
              loading={loading}
              error={error}
              createCategory={createCategory}
              updateCategory={updateCategory}
              deleteCategory={deleteCategory}
              reorderCategories={reorderCategories}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
