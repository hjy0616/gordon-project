import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getGroupedLinks } from "@/lib/links/server";
import { LinksClient } from "@/components/links/links-client";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const queryClient = new QueryClient();
  const categories = await getGroupedLinks();
  queryClient.setQueryData(["links"], { categories });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LinksClient />
    </HydrationBoundary>
  );
}
