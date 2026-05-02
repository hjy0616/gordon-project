"use client";

import { useHeartbeat } from "@/hooks/use-heartbeat";

export function HeartbeatMount() {
  useHeartbeat();
  return null;
}
