"use client";

import { Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaderboardTop3 } from "@/lib/queries/use-leaderboard-top3";

type Size = "default" | "sm";

interface UserRankBadgeProps {
  userId: string;
  size?: Size;
  className?: string;
}

const SIZE_CLASSES: Record<Size, string> = {
  default: "size-[22px] -bottom-[2px] -right-[4px]",
  sm: "size-[18px] -bottom-[2px] -right-[3px]",
};

const ICON_PX: Record<Size, number> = {
  default: 12,
  sm: 10,
};

export function UserRankBadge({
  userId,
  size = "default",
  className,
}: UserRankBadgeProps) {
  const { data } = useLeaderboardTop3();
  const adminIds = data?.adminIds ?? [];
  const topThree = data?.topThree ?? [];

  const isAdmin = adminIds.includes(userId);
  const rank = topThree.find((u) => u.id === userId)?.rank;

  if (!isAdmin && !rank) {
    return null;
  }

  const base = cn(
    "absolute rounded-full flex items-center justify-center",
    "border-2 border-background shadow-sm pointer-events-none",
    SIZE_CLASSES[size],
    className,
  );

  if (isAdmin) {
    return (
      <span
        className={cn(base, "bg-primary text-primary-foreground")}
        aria-label="관리자"
      >
        <Shield size={ICON_PX[size]} strokeWidth={2.5} />
      </span>
    );
  }

  const rankStyle =
    rank === 1
      ? { background: "var(--rank-gold)", color: "oklch(0.2 0.05 85)" }
      : rank === 2
        ? { background: "var(--rank-silver)", color: "oklch(0.25 0.02 250)" }
        : { background: "var(--rank-bronze)", color: "oklch(0.18 0.04 50)" };

  return (
    <span
      className={base}
      style={rankStyle}
      aria-label={`활동량 ${rank}위`}
    >
      <Crown size={ICON_PX[size]} strokeWidth={2.5} fill="currentColor" />
    </span>
  );
}
