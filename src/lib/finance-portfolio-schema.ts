import { z } from "zod";

export const Team = z.enum(["BLUE", "WHITE"]);
export type Team = z.infer<typeof Team>;

export const PortfolioRow = z.object({
  id: z.string().min(1).max(64),
  team: Team,
  name: z.string().trim().min(1).max(100),
  amount: z.number().int().nonnegative().max(1_000_000_000_000),
  memo: z.string().max(200).default(""),
});
export type PortfolioRow = z.infer<typeof PortfolioRow>;

export const PortfolioRows = z.array(PortfolioRow).max(50);

export const PortfolioData = z.object({
  totalCapital: z
    .number()
    .int()
    .nonnegative()
    .max(1_000_000_000_000),
  rows: PortfolioRows,
});
export type PortfolioData = z.infer<typeof PortfolioData>;

export const PortfolioPutBody = PortfolioData;
export type PortfolioPutBody = PortfolioData;

export function teamLabel(team: Team): string {
  return team === "BLUE" ? "청팀" : "백팀";
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Reads the Json column and normalizes both new shape ({totalCapital, rows})
 * and the legacy bare-array shape into PortfolioData.
 */
export function unwrapPortfolio(rawJson: unknown): PortfolioData {
  if (!rawJson) return { totalCapital: 0, rows: [] };
  if (Array.isArray(rawJson)) {
    return { totalCapital: 0, rows: rawJson as PortfolioRow[] };
  }
  if (typeof rawJson === "object") {
    const obj = rawJson as { totalCapital?: unknown; rows?: unknown };
    const totalCapital =
      typeof obj.totalCapital === "number" &&
      Number.isFinite(obj.totalCapital) &&
      obj.totalCapital >= 0
        ? Math.floor(obj.totalCapital)
        : 0;
    const rows = Array.isArray(obj.rows) ? (obj.rows as PortfolioRow[]) : [];
    return { totalCapital, rows };
  }
  return { totalCapital: 0, rows: [] };
}
