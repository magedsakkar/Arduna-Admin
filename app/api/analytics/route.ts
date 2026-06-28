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

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [users, orders, allUsersForRoles, payments, categoryStats, categories, governorateStats, paymentMethodStats, recentPosts] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true, status: true, totalAmount: true, currency: true } }),
    prisma.user.findMany({ select: { role: true } }),
    prisma.payment.findMany({ where: { status: "COMPLETED", createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true, amount: true, currency: true } }),
    prisma.product.groupBy({ by: ["categoryId"], where: { status: { not: "DELETED" } }, _count: { id: true } }),
    prisma.category.findMany({ select: { id: true, nameAr: true } }),
    prisma.user.groupBy({ by: ["governorate"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
    prisma.payment.groupBy({ by: ["method"], _count: { method: true } }),
    prisma.forumPost.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
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

  // Role distribution — uses ALL users, not time-filtered subset
  const roleMap: Record<string, number> = {};
  for (const u of allUsersForRoles) {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1;
  }

  // Product categories — use pre-fetched categories lookup (no N+1)
  const catNameMap: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.nameAr]));
  const categoryData = categoryStats.map((c) => ({
    name: catNameMap[c.categoryId] || c.categoryId,
    count: c._count.id,
  }));

  // Payment methods distribution
  const paymentMethodsData = paymentMethodStats.map((p) => ({
    method: p.method,
    count: p._count.method,
  }));

  // Forum activity last 30 days (group by date string)
  const forumByDate: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    forumByDate[key] = 0;
  }
  for (const post of recentPosts) {
    const key = post.createdAt.toISOString().slice(0, 10);
    if (forumByDate[key] !== undefined) forumByDate[key]++;
  }
  const forumActivity = Object.entries(forumByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, posts]) => ({ date, posts }));

  return NextResponse.json({
    success: true,
    data: {
      monthlySeries: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)),
      roleDistribution: Object.entries(roleMap).map(([role, count]) => ({ role, count })),
      categoryDistribution: categoryData.sort((a, b) => b.count - a.count).slice(0, 8),
      governorateDistribution: governorateStats.map((g) => ({ governorate: g.governorate || "Unknown", count: g._count.id })),
      paymentMethodsDistribution: paymentMethodsData,
      forumActivity,
    },
  });
}
