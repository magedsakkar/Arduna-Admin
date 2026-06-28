import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await getAuditLog(200);
  return NextResponse.json({ data: log });
}
