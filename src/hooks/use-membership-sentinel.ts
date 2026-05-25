"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role, UserStatus } from "@/generated/prisma/enums";

export type MembershipSnapshot =
  | {
      kind: "ok";
      status: UserStatus;
      role: Role;
      activeUntil: string | null;
      renewalRejectionReason: string | null;
      renewalRejectedAt: string | null;
    }
  | { kind: "deleted" }
  | { kind: "unauthorized" }
  | { kind: "transient" };

export const MEMBERSHIP_QUERY_KEY = ["me", "membership"] as const;
const POLL_BASE_MS = 10_000;
const POLL_FAST_MS = 10_000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STALE_TIME_MS = 5_000;
const BROADCAST_CHANNEL_NAME = "me-membership-v1";
const RENEWAL_QUERY_KEY = ["renewal-status"] as const;

export async function fetchMembership(): Promise<MembershipSnapshot> {
  const res = await fetch("/api/me/membership", {
    credentials: "include",
    cache: "no-store",
  }).catch(() => null);

  if (!res) return { kind: "transient" };
  if (res.status === 401) return { kind: "unauthorized" };
  if (!res.ok) return { kind: "transient" };

  const data = (await res.json().catch(() => null)) as
    | { deleted?: true }
    | {
        status: UserStatus;
        role: Role;
        activeUntil: string | null;
        renewalRejectionReason: string | null;
        renewalRejectedAt: string | null;
      }
    | null;

  if (!data) return { kind: "transient" };
  if ("deleted" in data && data.deleted) return { kind: "deleted" };
  if (!("status" in data)) return { kind: "transient" };

  return {
    kind: "ok",
    status: data.status,
    role: data.role,
    activeUntil: data.activeUntil ?? null,
    renewalRejectionReason: data.renewalRejectionReason ?? null,
    renewalRejectedAt: data.renewalRejectedAt ?? null,
  };
}

export function useMembershipSentinel() {
  const { update } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const lastSnapshotRef = useRef<MembershipSnapshot | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>("");
  const fromBroadcastRef = useRef<boolean>(false);
  const lockRef = useRef<boolean>(false);

  const query = useQuery<MembershipSnapshot>({
    queryKey: MEMBERSHIP_QUERY_KEY,
    queryFn: fetchMembership,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d || d.kind !== "ok" || !d.activeUntil) return POLL_BASE_MS;
      const msLeft = new Date(d.activeUntil).getTime() - Date.now();
      return msLeft > 0 && msLeft <= ONE_DAY_MS ? POLL_FAST_MS : POLL_BASE_MS;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: STALE_TIME_MS,
    retry: (count) => count < 2,
  });

  // BroadcastChannel — 다중 탭 동기화 (지원 안 되는 브라우저는 폴링 fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof BroadcastChannel === "undefined") return;

    tabIdRef.current = Math.random().toString(36).slice(2);
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastRef.current = bc;

    bc.onmessage = (ev) => {
      const msg = ev.data as
        | { tabId?: string; snapshot?: MembershipSnapshot }
        | null;
      if (!msg || !msg.snapshot) return;
      if (msg.tabId && msg.tabId === tabIdRef.current) return; // self echo
      fromBroadcastRef.current = true;
      queryClient.setQueryData(MEMBERSHIP_QUERY_KEY, msg.snapshot);
    };

    return () => {
      bc.close();
      broadcastRef.current = null;
    };
  }, [queryClient]);

  // 변경 감지 → 액션 매트릭스
  useEffect(() => {
    const current = query.data;
    if (!current) return;

    const prev = lastSnapshotRef.current;
    lastSnapshotRef.current = current;

    const fromBroadcast = fromBroadcastRef.current;
    fromBroadcastRef.current = false;

    if (!fromBroadcast && broadcastRef.current && tabIdRef.current) {
      broadcastRef.current.postMessage({
        tabId: tabIdRef.current,
        snapshot: current,
      });
    }

    if (lockRef.current) return;

    // 비-ok 결과 처리 (첫 로드 포함)
    if (current.kind === "unauthorized") {
      lockRef.current = true;
      void signOut({ callbackUrl: "/login" });
      return;
    }
    if (current.kind === "deleted") {
      lockRef.current = true;
      void signOut({ callbackUrl: "/login?reason=removed" });
      return;
    }
    if (current.kind === "transient") return;

    // 첫 로드(prev 없음)는 비교할 게 없음
    if (!prev || prev.kind !== "ok") return;

    const prevOk = prev;
    const curOk = current;

    // status 전환
    if (prevOk.status !== curOk.status) {
      lockRef.current = true;
      void (async () => {
        if (curOk.status === "SUSPENDED") {
          await signOut({ callbackUrl: "/login?reason=suspended" });
          return;
        }
        if (curOk.status === "PENDING") {
          await signOut({ callbackUrl: "/login?reason=pending" });
          return;
        }
        if (curOk.status === "EXPIRED") {
          await update();
          router.replace("/expired");
          return;
        }
        if (curOk.status === "ACTIVE") {
          await update();
          router.replace("/dashboard");
          return;
        }
        lockRef.current = false;
      })();
      return;
    }

    // status 동일 + activeUntil만 변경
    if (prevOk.activeUntil !== curOk.activeUntil) {
      void (async () => {
        await update();
        router.refresh();
      })();
    }

    // 거부 사유 / 거부 시각 변경 — status 무관 (ACTIVE 사용자가 사전 재인증 후 거부받은 케이스 포함)
    const rejectionChanged =
      prevOk.renewalRejectionReason !== curOk.renewalRejectionReason ||
      prevOk.renewalRejectedAt !== curOk.renewalRejectedAt;
    if (rejectionChanged) {
      // (app) 트리: ["renewal-status"] useQuery consumers (renewal-banner, sidebar-renewal-status)
      void queryClient.invalidateQueries({ queryKey: RENEWAL_QUERY_KEY });
      // (expired) 트리: /expired/page.tsx가 server component로 Prisma → props 전달. RSC 재패치 필요.
      router.refresh();
    }
  }, [query.data, router, update, queryClient]);
}
