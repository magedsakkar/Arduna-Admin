import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingPayments,
    activeAlerts,
    forumPosts,
    newUsersThisMonth,
    recentOrders,
    ordersByStatus,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { status: { not: "DELETED" } } }),
    prisma.order.count(),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.alert.count({ where: { active: true } }),
    prisma.forumPost.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  // Monthly registrations for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyUsers = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const monthlyData: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = 0;
  }
  for (const u of monthlyUsers) {
    const d = u.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyData) monthlyData[key]++;
  }

  return NextResponse.json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      pendingPayments,
      activeAlerts,
      forumPosts,
      newUsersThisMonth,
      recentOrders,
      ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count.id })),
      monthlyRegistrations: Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
    },
  });
}
