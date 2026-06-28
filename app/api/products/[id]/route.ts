import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, featured } = await req.json();

  const allowed: Record<string, unknown> = {};
  if (status && ["ACTIVE", "PAUSED", "DELETED"].includes(status)) allowed.status = status;
  if (typeof featured === "boolean") allowed.featured = featured;

  const product = await prisma.product.update({ where: { id }, data: allowed });

  await logAudit({
    adminId: session.id,
    adminEmail: session.email,
    action: "PRODUCT_STATUS_CHANGE",
    target: `product:${id}`,
    details: `Updated ${Object.keys(allowed).join(", ")} — ${JSON.stringify(allowed)}`,
  });

  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { status: "DELETED" } });
  return NextResponse.json({ success: true });
}
