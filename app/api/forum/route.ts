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
  const category = searchParams.get("category") || "";

  const where: Record<string, unknown> = {};
  if (search) where.titleAr = { contains: search, mode: "insensitive" };
  if (status) where.status = status;
  if (category) where.category = category;

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
