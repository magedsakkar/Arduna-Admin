import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const governorate = searchParams.get("governorate");
    const landType = searchParams.get("landType");

    const where: Prisma.LandListingWhereInput = {
      ...(status && { status: status as Prisma.EnumLandStatusFilter }),
      ...(governorate && { governorate }),
      ...(landType && { landType: landType as Prisma.EnumLandTypeFilter }),
    };

    const [listings, total] = await Promise.all([
      prisma.landListing.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, email: true, phone: true } },
          _count: { select: { inquiries: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.landListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to fetch land listings", details: message },
      { status: 500 }
    );
  }
}
