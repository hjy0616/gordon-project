import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import { trackEvent } from "@/lib/analytics";

export const runtime = "nodejs";

// page_view는 Vercel Web Analytics로 위임.
// post.* / lasagna.* 같은 서버 액션 이벤트는 클라이언트 위조 방지를 위해
// 도메인 API 내부의 trackEvent() 호출로만 기록한다 (이 엔드포인트는 거부).
// 이 엔드포인트는 사용자가 직접 보고하는 신호(wow/pain)만 허용.
const ALLOWED_TYPES = new Set(["wow", "pain"]);

const MAX_LABEL_LEN = 200;
const MAX_PATH_LEN = 500;
const MAX_PROPS_BYTES = 4 * 1024;

type TrackBody = {
  type?: string;
  label?: string;
  path?: string;
  props?: Record<string, unknown>;
};

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: TrackBody = {};
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type : "";
  if (!type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
  }

  let serializedProps: string | null = null;
  if (body.props !== undefined && body.props !== null) {
    if (typeof body.props !== "object" || Array.isArray(body.props)) {
      return NextResponse.json({ ok: false, error: "props must be an object" }, { status: 400 });
    }
    try {
      serializedProps = JSON.stringify(body.props);
    } catch {
      return NextResponse.json({ ok: false, error: "props not serializable" }, { status: 400 });
    }
    if (Buffer.byteLength(serializedProps, "utf8") > MAX_PROPS_BYTES) {
      return NextResponse.json(
        { ok: false, error: `props exceeds ${MAX_PROPS_BYTES} bytes` },
        { status: 413 },
      );
    }
  }

  const cleanLabel =
    typeof body.label === "string" ? body.label.slice(0, MAX_LABEL_LEN) : undefined;
  const cleanPath =
    typeof body.path === "string" ? body.path.slice(0, MAX_PATH_LEN) : undefined;

  await trackEvent({
    userId: authUser.id,
    type,
    label: cleanLabel,
    path: cleanPath,
    props: serializedProps ? (JSON.parse(serializedProps) as Record<string, unknown>) : undefined,
  });

  return NextResponse.json({ ok: true });
}
