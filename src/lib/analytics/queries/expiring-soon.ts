import { prisma } from "@/lib/prisma";

type CountRow = { count: bigint };

export async function computeExpiring14d(): Promise<number> {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM users
    WHERE status = 'ACTIVE'
      AND role = 'USER'
      AND active_until IS NOT NULL
      AND active_until BETWEEN NOW() AND NOW() + INTERVAL '14 days';
  `;
  return rows[0] ? Number(rows[0].count) : 0;
}
