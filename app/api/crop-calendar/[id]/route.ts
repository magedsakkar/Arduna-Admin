import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const entry = await prisma.cropCalendar.update({
    where: { id },
    data: {
      ...(body.cropNameAr && { cropNameAr: body.cropNameAr }),
      ...(body.cropNameEn !== undefined && { cropNameEn: body.cropNameEn }),
      ...(body.governorate && { governorate: body.governorate }),
      ...(body.plantMonth && { plantMonth: +body.plantMonth }),
      ...(body.harvestMonth && { harvestMonth: +body.harvestMonth }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json({ success: true, data: entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.cropCalendar.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
