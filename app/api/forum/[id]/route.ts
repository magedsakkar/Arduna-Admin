import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed: Record<string, unknown> = {};
  if (body.status && ["PUBLISHED", "HIDDEN", "DELETED"].includes(body.status)) allowed.status = body.status;
  if (typeof body.pinned === "boolean") allowed.pinned = body.pinned;
  if (typeof body.solved === "boolean") allowed.solved = body.solved;

  const post = await prisma.forumPost.update({ where: { id }, data: allowed });
  return NextResponse.json({ success: true, data: post });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.forumPost.update({ where: { id }, data: { status: "DELETED" } });
  return NextResponse.json({ success: true });
}
