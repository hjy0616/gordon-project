import { Skeleton } from "@/components/ui/skeleton";

export function MapLoading() {
  return (
    <div className="relative -m-6 h-[calc(100svh-3rem)] w-[calc(100%+3rem)] bg-background">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="absolute left-4 top-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>
      <div className="absolute bottom-4 left-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    </div>
  );
}
