import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      products: { take: 5, orderBy: { createdAt: "desc" } },
      orders: { take: 5, orderBy: { createdAt: "desc" } },
      _count: { select: { products: true, orders: true, forumPosts: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed: Record<string, unknown> = {};
  if (typeof body.active === "boolean") allowed.active = body.active;
  if (typeof body.verified === "boolean") allowed.verified = body.verified;
  if (body.role && ["ADMIN", "MODERATOR", "FARMER", "BUYER", "EXPERT"].includes(body.role)) {
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
    }
    allowed.role = body.role;
  }

  const user = await prisma.user.update({ where: { id }, data: allowed });
  return NextResponse.json({ success: true, data: user });
}
