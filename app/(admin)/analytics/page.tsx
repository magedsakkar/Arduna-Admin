"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  monthlySeries: Array<{ month: string; users: number; orders: number; revenue: number }>;
  roleDistribution: Array<{ role: string; count: number }>;
  categoryDistribution: Array<{ name: string; count: number }>;
  governorateDistribution: Array<{ governorate: string; count: number }>;
}

const COLORS = ["#2ea043", "#58a6ff", "#e3b341", "#f85149", "#bc8cff", "#ff9500", "#39d353", "#79c0ff"];

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px" }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{title}</h2>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); else setError(d.error || "Failed"); })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>Loading analytics…</div>;
  if (error) return <div style={{ color: "#f85149" }}>{error}</div>;
  if (!data) return null;

  const tooltipStyle = {
    backgroundColor: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontSize: "12px",
  };

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", marginBottom: "24px" }}>Analytics</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Users & Orders over time */}
        <ChartBox title="Users & Orders (12 months)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="users" stroke="#2ea043" strokeWidth={2} dot={false} name="New Users" />
              <Line type="monotone" dataKey="orders" stroke="#58a6ff" strokeWidth={2} dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* Revenue over time */}
        <ChartBox title="Revenue (SYP, 12 months)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => typeof v === "number" ? v.toLocaleString() + " SYP" : String(v)} />
              <Bar dataKey="revenue" fill="#2ea043" radius={[3, 3, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        {/* User roles pie */}
        <ChartBox title="User Roles">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.roleDistribution} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={80} label={({ role, percent }) => `${role} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {data.roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* Category distribution */}
        <ChartBox title="Products by Category">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.categoryDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "var(--text-muted)", fontSize: 10 }} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#58a6ff" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* Governorate distribution */}
        <ChartBox title="Users by Governorate">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.governorateDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis dataKey="governorate" type="category" tick={{ fill: "var(--text-muted)", fontSize: 10 }} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#e3b341" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </div>
  );
}
