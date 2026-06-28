import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed: Record<string, unknown> = {};
  if (typeof body.active === "boolean") allowed.active = body.active;
  if (body.severity) allowed.severity = body.severity;
  if (body.titleAr) allowed.titleAr = body.titleAr;
  if (body.contentAr) allowed.contentAr = body.contentAr;

  const alert = await prisma.alert.update({ where: { id }, data: allowed });
  return NextResponse.json({ success: true, data: alert });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
