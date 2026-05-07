export function getPortfolioAllowedUserIds(): string[] {
  return (process.env.PORTFOLIO_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isPortfolioAllowed(
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return getPortfolioAllowedUserIds().includes(userId);
}
