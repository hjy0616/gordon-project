import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-utils";
import { getGroupedLinks } from "@/lib/links/server";

export async function GET() {
  const user = await requireActiveUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await getGroupedLinks();
  return NextResponse.json({ categories });
}
