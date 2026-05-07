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

export const PortfolioPutBody = z.object({
  rows: PortfolioRows,
});
export type PortfolioPutBody = z.infer<typeof PortfolioPutBody>;

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
