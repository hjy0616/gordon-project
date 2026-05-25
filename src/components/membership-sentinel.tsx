"use client";

import { useMembershipSentinel } from "@/hooks/use-membership-sentinel";

export function MembershipSentinel() {
  useMembershipSentinel();
  return null;
}
