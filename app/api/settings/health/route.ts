import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [users, products, orders, payments, forumPosts, alerts, conversations, reviews, messages] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.payment.count(),
        prisma.forumPost.count(),
        prisma.alert.count(),
        prisma.conversation.count(),
        prisma.review.count(),
        prisma.message.count(),
      ]);

    return NextResponse.json({
      connected: true,
      counts: { users, products, orders, payments, forumPosts, alerts, conversations, reviews, messages },
    });
  } catch {
    return NextResponse.json({ connected: false, counts: {} });
  }
}
