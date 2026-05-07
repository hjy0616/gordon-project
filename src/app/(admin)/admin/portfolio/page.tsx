import { notFound } from "next/navigation";
import { requireActiveAdminOrRedirect } from "@/lib/auth-utils";
import { isPortfolioAllowed } from "@/lib/finance-portfolio-access";
import { prisma } from "@/lib/prisma";
import type { PortfolioRow } from "@/lib/finance-portfolio-schema";
import { PortfolioEditor } from "@/components/admin/portfolio/portfolio-editor";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await requireActiveAdminOrRedirect();
  if (!user) return null;

  if (!isPortfolioAllowed(user.id)) {
    notFound();
  }

  const portfolio = await prisma.financePortfolio.findUnique({
    where: { userId: user.id },
  });

  const initialRows =
    (portfolio?.rows as PortfolioRow[] | null | undefined) ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">포트폴리오</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          청팀 50% / 백팀 50% 배분 관리
        </p>
      </header>
      <PortfolioEditor initialRows={initialRows} />
    </div>
  );
}
