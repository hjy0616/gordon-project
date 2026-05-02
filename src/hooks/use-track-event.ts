"use client";

import { useCallback } from "react";

const TRACK_ENDPOINT = "/api/internal/track";

export type TrackPayload = {
  type: string;
  label?: string;
  path?: string;
  props?: Record<string, unknown>;
};

export function useTrackEvent() {
  return useCallback((type: string, payload?: Omit<TrackPayload, "type">) => {
    if (typeof window === "undefined") return;
    const body = JSON.stringify({
      type,
      label: payload?.label,
      path: payload?.path ?? window.location.pathname,
      props: payload?.props,
    });

    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* analytics best-effort */
    });
  }, []);
}
