import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const governorate = searchParams.get("governorate") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { titleAr: { contains: search, mode: "insensitive" } },
      { titleEn: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (governorate) where.governorate = governorate;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        category: { select: { nameAr: true, nameEn: true } },
        _count: { select: { orderItems: true, reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
