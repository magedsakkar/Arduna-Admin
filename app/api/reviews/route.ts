import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = 20;
  const ratingStr = req.nextUrl.searchParams.get("rating");
  const rating = ratingStr ? parseInt(ratingStr) : undefined;

  const where = rating ? { rating } : {};

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      include: {
        product: { select: { id: true, titleAr: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
