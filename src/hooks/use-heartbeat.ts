"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_ENDPOINT = "/api/internal/heartbeat";
const SESSION_STORAGE_KEY = "gordon.analytics.sessionId";

function readSessionId(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSessionId(id: string | null) {
  try {
    if (id) window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    else window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* sessionStorage unavailable (private mode) — ignore */
  }
}

export function useHeartbeat() {
  const lastPingRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    sessionIdRef.current = readSessionId();

    const buildBody = (ended: boolean) => {
      const params = new URLSearchParams(window.location.search);
      return JSON.stringify({
        sessionId: sessionIdRef.current,
        referer: document.referrer || "",
        utmSource: params.get("utm_source") ?? null,
        utmMedium: params.get("utm_medium") ?? null,
        utmCampaign: params.get("utm_campaign") ?? null,
        path: window.location.pathname,
        ended,
      });
    };

    const ping = async (forceFlush = false) => {
      if (document.visibilityState === "hidden" && !forceFlush) return;
      const now = Date.now();
      if (
        !forceFlush &&
        now - lastPingRef.current < HEARTBEAT_INTERVAL_MS - 1_000
      ) {
        return;
      }
      lastPingRef.current = now;

      const body = buildBody(false);

      try {
        const res = await fetch(HEARTBEAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
        if (!res.ok) return;
        const json = (await res.json().catch(() => null)) as
          | { sessionId?: string }
          | null;
        if (json?.sessionId && json.sessionId !== sessionIdRef.current) {
          sessionIdRef.current = json.sessionId;
          writeSessionId(json.sessionId);
        }
      } catch {
        /* analytics best-effort */
      }
    };

    const flushEnd = () => {
      // Tab is closing or backgrounded — end ONLY this tab's session via beacon.
      if (!sessionIdRef.current) return;
      const body = buildBody(true);
      if ("sendBeacon" in navigator) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(HEARTBEAT_ENDPOINT, blob);
        return;
      }
      void fetch(HEARTBEAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        /* best-effort */
      });
    };

    void ping(false);
    const interval = window.setInterval(() => void ping(false), HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void ping(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onPageHide = () => flushEnd();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);
}
