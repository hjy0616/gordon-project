"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useLasagnaSync } from "@/lib/hooks/use-lasagna-sync";

const LasagnaView = dynamic(
  () => import("@/components/lasagna/lasagna-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  },
);

export default function LasagnaPage() {
  useLasagnaSync();
  return <LasagnaView />;
}
