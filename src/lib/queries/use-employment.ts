import { useQuery } from "@tanstack/react-query";
import type { EmploymentIndicator } from "@/app/api/employment/route";

interface EmploymentResponse {
  data: EmploymentIndicator[];
  updatedAt: string;
  source: "fred" | "error";
}

const FALLBACK: EmploymentResponse = {
  data: [],
  updatedAt: "",
  source: "error",
};

export function useEmployment() {
  return useQuery<EmploymentResponse>({
    queryKey: ["employment"],
    queryFn: async () => {
      const res = await fetch("/api/employment");
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    retry: 2,
    placeholderData: FALLBACK,
  });
}
