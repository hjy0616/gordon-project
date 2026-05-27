"use client";

import { cn } from "@/lib/utils";

interface LinkCategoryChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export function LinkCategoryChip({ label, count, active, onClick }: LinkCategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          "ml-1.5 text-xs",
          active ? "opacity-80" : "opacity-60",
        )}
      >
        {count}
      </span>
    </button>
  );
}
