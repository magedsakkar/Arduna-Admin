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
  const governorate = searchParams.get("governorate") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { cropNameAr: { contains: search, mode: "insensitive" } },
      { cropNameEn: { contains: search, mode: "insensitive" } },
    ];
  }
  if (governorate) where.governorate = governorate;

  const [entries, total] = await Promise.all([
    prisma.cropCalendar.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ governorate: "asc" }, { cropNameAr: "asc" }],
    }),
    prisma.cropCalendar.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { cropNameAr, cropNameEn, governorate, plantMonth, harvestMonth, notes } = body;

  if (!cropNameAr || !governorate || !plantMonth || !harvestMonth) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prisma.cropCalendar.create({
    data: { cropNameAr, cropNameEn, governorate, plantMonth: +plantMonth, harvestMonth: +harvestMonth, notes },
  });

  return NextResponse.json({ success: true, data: entry });
}
