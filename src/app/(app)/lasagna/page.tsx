"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LasagnaView = dynamic(
  () => import("@/components/lasagna/lasagna-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100svh-3rem)] w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  },
);

export default function LasagnaPage() {
  return <LasagnaView />;
}
