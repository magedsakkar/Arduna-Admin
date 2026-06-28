import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gov = req.nextUrl.searchParams.get("governorate");
  const data = await prisma.weatherData.findMany({
    where: gov ? { governorate: gov } : undefined,
    orderBy: [{ governorate: "asc" }, { date: "desc" }],
    take: 100,
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { governorate, date, tempMin, tempMax, humidity, rainfall, windSpeed, description, descriptionAr, icon } = body;

  if (!governorate || !date || tempMin === undefined || tempMax === undefined || humidity === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prisma.weatherData.upsert({
    where: { governorate_date: { governorate, date: new Date(date) } },
    create: { governorate, date: new Date(date), tempMin: Number(tempMin), tempMax: Number(tempMax), humidity: Number(humidity), rainfall: rainfall ? Number(rainfall) : null, windSpeed: windSpeed ? Number(windSpeed) : null, description: description || null, descriptionAr: descriptionAr || null, icon: icon || null },
    update: { tempMin: Number(tempMin), tempMax: Number(tempMax), humidity: Number(humidity), rainfall: rainfall ? Number(rainfall) : null, windSpeed: windSpeed ? Number(windSpeed) : null, description: description || null, descriptionAr: descriptionAr || null, icon: icon || null },
  });

  return NextResponse.json({ data: entry });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.weatherData.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
