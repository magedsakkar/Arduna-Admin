"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime, statusColors } from "@/lib/format";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  activeAlerts: number;
  forumPosts: number;
  newUsersThisMonth: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    buyer: { name: string; email: string };
    seller: { name: string };
  }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  monthlyRegistrations: Array<{ month: string; count: number }>;
}

function StatCard({ label, value, sub, color = "#c9d1d9", href }: { label: string; value: string | number; sub?: string; color?: string; href?: string }) {
  const content = (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px 20px",
        cursor: href ? "pointer" : "default",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => href && ((e.currentTarget.style.borderColor = "var(--text-muted)"))}
      onMouseLeave={(e) => href && ((e.currentTarget.style.borderColor = "var(--border)"))}
    >
      <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "24px", fontWeight: "600", color }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>;
  return content;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
        else setError(d.error || "Failed to load stats");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>Loading dashboard…</div>;
  if (error) return <div style={{ color: "#f85149", padding: "20px 0" }}>{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", marginBottom: "24px" }}>Overview</h1>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} sub={`+${stats.newUsersThisMonth} this month`} color="var(--text)" href="/users" />
        <StatCard label="Products" value={stats.totalProducts.toLocaleString()} color="var(--primary-hover)" href="/products" />
        <StatCard label="Orders" value={stats.totalOrders.toLocaleString()} color="var(--link)" href="/orders" />
        <StatCard label="Revenue" value={formatCurrency(stats.totalRevenue)} color="var(--primary-hover)" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} color={stats.pendingPayments > 0 ? "var(--warning)" : "var(--text)"} href="/payments" />
        <StatCard label="Active Alerts" value={stats.activeAlerts} color={stats.activeAlerts > 0 ? "#f85149" : "var(--text)"} href="/alerts" />
        <StatCard label="Forum Posts" value={stats.forumPosts.toLocaleString()} color="var(--text)" href="/forum" />
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Recent orders */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Recent Orders</h2>
            <Link href="/orders" style={{ fontSize: "12px", color: "var(--link)" }}>View all →</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>#{o.orderNumber}</td>
                  <td>{o.buyer.name || o.buyer.email}</td>
                  <td style={{ color: "var(--primary-hover)" }}>{formatCurrency(o.totalAmount, o.currency)}</td>
                  <td>
                    <span className={`${statusColors[o.status] || "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Orders by status + Monthly registrations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <h2 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Orders by Status</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {stats.ordersByStatus.map((o) => (
                <div
                  key={o.status}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    minWidth: "80px",
                  }}
                >
                  <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{o.status}</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--text)" }}>{o.count}</p>
                </div>
              ))}
              {stats.ordersByStatus.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No orders yet</p>}
            </div>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <h2 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>New Users (6 months)</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
              {stats.monthlyRegistrations.map((m) => {
                const max = Math.max(...stats.monthlyRegistrations.map((x) => x.count), 1);
                const pct = (m.count / max) * 100;
                return (
                  <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max(pct, 4)}%`,
                          background: "var(--primary)",
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.3s",
                        }}
                        title={`${m.month}: ${m.count} users`}
                      />
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
