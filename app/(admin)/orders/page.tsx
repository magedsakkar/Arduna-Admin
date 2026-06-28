"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate, formatCurrency, statusColors } from "@/lib/format";

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  currency: string;
  governorate: string;
  createdAt: string;
  buyer: { id: string; name: string | null; email: string; phone: string | null };
  seller: { id: string; name: string | null; email: string };
  items: Array<{ product: { titleAr: string }; quantity: number }>;
  payment: { status: string; method: string; amount: number } | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const ORDER_STATUSES = ["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/orders?${params}`);
    const d = await res.json();
    if (d.success) { setOrders(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [search, status]);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await res.json();
    if (d.success) setOrders((o) => o.map((x) => x.id === id ? { ...x, status: newStatus } : x));
    else alert(d.error || "Failed to update");
    setUpdating(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Orders</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} total orders</p>
        </div>
        <button
          onClick={async () => {
            const params = new URLSearchParams({ page: "1", limit: "1000" });
            if (search) params.set("search", search);
            if (status) params.set("status", status);
            const res = await fetch(`/api/orders?${params}`);
            const d = await res.json();
            if (!d.success) return;
            const rows: string[][] = [["orderNumber","buyerName","buyerEmail","sellerName","totalAmount","currency","paymentMethod","status","paymentStatus","governorate","createdAt"]];
            for (const o of d.data) rows.push([o.orderNumber, o.buyer.name || "", o.buyer.email, o.seller.name || o.seller.email, String(o.totalAmount), o.currency, o.paymentMethod, o.status, o.paymentStatus, o.governorate, o.createdAt]);
            downloadCSV(rows, "orders.csv");
          }}
          style={{ padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}
        >
          ⬇ Export CSV
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input type="search" placeholder="Search order number…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1", minWidth: "200px", height: "34px" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "34px" }}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No orders found</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>#{o.orderNumber}</td>
                <td>
                  <div style={{ fontSize: "13px" }}>{o.buyer.name || "—"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{o.buyer.phone || o.buyer.email}</div>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{o.seller.name || o.seller.email}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {o.items.slice(0, 2).map((i, idx) => (
                    <div key={idx}>{i.product.titleAr} ×{i.quantity}</div>
                  ))}
                  {o.items.length > 2 && <div>+{o.items.length - 2} more</div>}
                </td>
                <td style={{ color: "var(--primary-hover)" }}>{formatCurrency(o.totalAmount, o.currency)}</td>
                <td>
                  <span className={`${statusColors[o.paymentStatus] || "bg-gray-700 text-gray-300"} text-xs px-1.5 py-0.5 rounded`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(o.createdAt)}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    disabled={updating === o.id}
                    style={{ padding: "3px 6px", height: "26px", fontSize: "11px" }}
                  >
                    {ORDER_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchOrders(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
