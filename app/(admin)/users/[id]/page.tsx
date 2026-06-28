"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatDate, formatCurrency, roleColors, statusColors } from "@/lib/format";

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  governorate: string | null;
  address: string | null;
  bio: string | null;
  verified: boolean;
  active: boolean;
  createdAt: string;
  products: Array<{ id: string; titleAr: string; status: string; price: number; currency: string; views: number; createdAt: string; category: { nameAr: string } }>;
  orders: Array<{ id: string; orderNumber: string; status: string; totalAmount: number; currency: string; createdAt: string }>;
  sellerOrders: Array<{ id: string; orderNumber: string; status: string; totalAmount: number; currency: string; createdAt: string }>;
  forumPosts: Array<{ id: string; titleAr: string; status: string; views: number; createdAt: string }>;
  payments: Array<{ id: string; method: string; amount: number; currency: string; status: string; createdAt: string }>;
}

const ROLES = ["FARMER", "BUYER", "EXPERT", "MODERATOR", "ADMIN"];

export default function UserDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products" | "orders" | "posts" | "payments">("products");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setUpdating(true);
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) setUser((u) => u ? { ...u, ...body } as UserDetail : u);
    else alert(d.error || "Failed");
    setUpdating(false);
  }

  if (loading) return <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "60px" }}>Loading…</div>;
  if (!user) return <div style={{ color: "#f85149", padding: "20px" }}>User not found.</div>;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px", background: active ? "var(--primary)" : "transparent",
    border: "1px solid " + (active ? "var(--primary)" : "var(--border)"),
    borderRadius: "6px", color: active ? "#fff" : "var(--text-muted)",
    fontSize: "13px", cursor: "pointer",
  });

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.push("/users")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
        ← Back to Users
      </button>

      {/* Profile header */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(46,160,67,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "700", color: "var(--accent)", flexShrink: 0 }}>
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "var(--text)" }}>{user.name || "—"}</h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{user.email}</p>
          {user.phone && <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{user.phone}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            <span className={`${roleColors[user.role] || "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}>{user.role}</span>
            <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", background: user.active ? "rgba(63,185,80,0.15)" : "rgba(248,81,73,0.15)", color: user.active ? "#3fb950" : "#f85149" }}>
              {user.active ? "Active" : "Disabled"}
            </span>
            {user.verified && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", background: "rgba(88,166,255,0.15)", color: "#58a6ff" }}>Verified ✓</span>}
            {user.governorate && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", background: "rgba(227,179,65,0.15)", color: "#e3b341" }} dir="rtl">{user.governorate}</span>}
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Joined {formatDate(user.createdAt)}</p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: "var(--text-muted)" }}>Role:</label>
            <select
              value={user.role}
              onChange={(e) => patch({ role: e.target.value })}
              disabled={updating}
              style={{ height: "30px", fontSize: "12px", padding: "0 6px" }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button
            onClick={() => patch({ active: !user.active })}
            disabled={updating}
            style={{ padding: "5px 12px", background: user.active ? "rgba(248,81,73,0.12)" : "rgba(63,185,80,0.12)", border: `1px solid ${user.active ? "rgba(248,81,73,0.3)" : "rgba(63,185,80,0.3)"}`, borderRadius: "6px", color: user.active ? "#f85149" : "#3fb950", fontSize: "12px", cursor: "pointer" }}
          >
            {user.active ? "Disable Account" : "Enable Account"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Products", value: user.products.length },
          { label: "Buyer Orders", value: user.orders.length },
          { label: "Seller Orders", value: user.sellerOrders.length },
          { label: "Forum Posts", value: user.forumPosts.length },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--accent)" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button style={tabStyle(tab === "products")} onClick={() => setTab("products")}>Products ({user.products.length})</button>
        <button style={tabStyle(tab === "orders")} onClick={() => setTab("orders")}>Orders ({user.orders.length + user.sellerOrders.length})</button>
        <button style={tabStyle(tab === "posts")} onClick={() => setTab("posts")}>Forum ({user.forumPosts.length})</button>
        <button style={tabStyle(tab === "payments")} onClick={() => setTab("payments")}>Payments ({user.payments.length})</button>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        {tab === "products" && (
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Views</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {user.products.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>No products</td></tr>
              ) : user.products.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: "500", color: "var(--text)" }} dir="rtl">{p.titleAr}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }} dir="rtl">{p.category.nameAr}</td>
                  <td style={{ color: "var(--accent)" }}>{formatCurrency(p.price, p.currency)}</td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{p.views}</td>
                  <td><span className={`${statusColors[p.status] || "bg-gray-700 text-gray-300"} text-xs px-1.5 py-0.5 rounded`}>{p.status}</span></td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "orders" && (
          <table>
            <thead><tr><th>Order #</th><th>Role</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {user.orders.length === 0 && user.sellerOrders.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>No orders</td></tr>
              ) : [
                ...user.orders.map((o) => ({ ...o, orderRole: "Buyer" })),
                ...user.sellerOrders.map((o) => ({ ...o, orderRole: "Seller" })),
              ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((o) => (
                <tr key={o.id + o.orderRole}>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>#{o.orderNumber}</td>
                  <td><span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", background: o.orderRole === "Buyer" ? "rgba(88,166,255,0.15)" : "rgba(63,185,80,0.15)", color: o.orderRole === "Buyer" ? "#58a6ff" : "#3fb950" }}>{o.orderRole}</span></td>
                  <td style={{ color: "var(--accent)" }}>{formatCurrency(o.totalAmount, o.currency)}</td>
                  <td><span className={`${statusColors[o.status] || "bg-gray-700 text-gray-300"} text-xs px-1.5 py-0.5 rounded`}>{o.status}</span></td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "posts" && (
          <table>
            <thead><tr><th>Title</th><th>Views</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {user.forumPosts.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>No forum posts</td></tr>
              ) : user.forumPosts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: "500", color: "var(--text)" }} dir="rtl">{p.titleAr}</td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{p.views}</td>
                  <td><span className={`${statusColors[p.status] || "bg-gray-700 text-gray-300"} text-xs px-1.5 py-0.5 rounded`}>{p.status}</span></td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "payments" && (
          <table>
            <thead><tr><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {user.payments.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>No payments</td></tr>
              ) : user.payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--text-muted)" }}>{p.method}</td>
                  <td style={{ color: "var(--accent)" }}>{formatCurrency(p.amount, p.currency)}</td>
                  <td><span className={`${statusColors[p.status] || "bg-gray-700 text-gray-300"} text-xs px-1.5 py-0.5 rounded`}>{p.status}</span></td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
