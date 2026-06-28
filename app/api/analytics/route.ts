import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [users, orders, products, payments, categoryStats, governorateStats] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true, role: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true, status: true, totalAmount: true, currency: true } }),
    prisma.product.findMany({ where: { status: { not: "DELETED" } }, select: { categoryId: true, category: { select: { nameAr: true } }, views: true } }),
    prisma.payment.findMany({ where: { status: "COMPLETED", createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true, amount: true, currency: true } }),
    prisma.product.groupBy({ by: ["categoryId"], where: { status: { not: "DELETED" } }, _count: { id: true } }),
    prisma.user.groupBy({ by: ["governorate"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
  ]);

  // Build monthly series
  const months: Record<string, { month: string; users: number; orders: number; revenue: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { month: key, users: 0, orders: 0, revenue: 0 };
  }

  for (const u of users) {
    const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) months[key].users++;
  }
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) months[key].orders++;
  }
  for (const p of payments) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) months[key].revenue += Number(p.amount);
  }

  // Role distribution
  const roleMap: Record<string, number> = {};
  for (const u of users) {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1;
  }

  // Product categories (need names — join with products result)
  const catNameMap: Record<string, string> = {};
  for (const p of products) {
    catNameMap[p.categoryId] = (p as { category?: { nameAr: string } }).category?.nameAr || p.categoryId;
  }
  const categoryData = categoryStats.map((c) => ({
    name: catNameMap[c.categoryId] || c.categoryId,
    count: c._count.id,
  }));

  return NextResponse.json({
    success: true,
    data: {
      monthlySeries: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)),
      roleDistribution: Object.entries(roleMap).map(([role, count]) => ({ role, count })),
      categoryDistribution: categoryData.sort((a, b) => b.count - a.count).slice(0, 8),
      governorateDistribution: governorateStats.map((g) => ({ governorate: g.governorate || "Unknown", count: g._count.id })),
    },
  });
}
