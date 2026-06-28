import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (active !== null && active !== "") where.active = active === "true";

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.alert.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: alerts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { titleAr, contentAr, type, severity, governorates, expiresAt } = body;

  if (!titleAr || !contentAr || !type || !severity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const alert = await prisma.alert.create({
    data: {
      titleAr,
      contentAr,
      type,
      severity,
      governorates: governorates || [],
      images: [],
      authorId: session.id,
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json({ success: true, data: alert });
}
