import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-utils";
import { processMindMapUpdate } from "@/lib/mind-map/update";

/**
 * sendBeacon 전용 POST. PUT과 동일한 검증/OCC 적용.
 * navigator.sendBeacon은 PUT을 보낼 수 없어 별도 라우트가 필요하다.
 * 응답 body는 페이지가 종료되는 상황에서 무시되지만, normal fetch keepalive로
 * 호출되는 경우도 있어 일관된 응답 shape를 반환한다.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await requireActiveUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await processMindMapUpdate(body, user.id, id);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        ...(result.serverRow ? { serverRow: result.serverRow } : {}),
      },
      { status: result.status },
    );
  }

  return NextResponse.json(result.row);
}
