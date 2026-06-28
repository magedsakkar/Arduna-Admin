import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = 20;
  const search = req.nextUrl.searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { buyer: { name: { contains: search, mode: "insensitive" as const } } },
          { buyer: { email: { contains: search, mode: "insensitive" as const } } },
          { seller: { name: { contains: search, mode: "insensitive" as const } } },
          { seller: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, titleAr: true } },
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversation.count({ where }),
  ]);

  return NextResponse.json({ data: conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
