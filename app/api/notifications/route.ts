import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const type = req.nextUrl.searchParams.get("type"); // "users" or "history"

  if (type === "history") {
    const notifications = await prisma.notification.findMany({
      where: { type: "SYSTEM" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ data: notifications });
  }

  // User search autocomplete
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: { id: true, name: true, email: true },
    take: 10,
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId, title, message, type, link } = await req.json();

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  const notifType = (["ORDER", "PAYMENT", "ALERT", "FORUM", "SYSTEM"].includes(type) ? type : "SYSTEM") as
    | "ORDER"
    | "PAYMENT"
    | "ALERT"
    | "FORUM"
    | "SYSTEM";

  if (targetUserId) {
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        titleAr: title,
        messageAr: message,
        type: notifType,
        link: link || null,
        actorId: session.id,
      },
    });
    return NextResponse.json({ success: true, sent: 1 });
  }

  // Broadcast to all active users
  const users = await prisma.user.findMany({ where: { active: true }, select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      titleAr: title,
      messageAr: message,
      type: notifType,
      link: link || null,
      actorId: session.id,
    })),
  });

  return NextResponse.json({ success: true, sent: users.length });
}
