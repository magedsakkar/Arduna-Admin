"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate, formatCurrency, statusColors, truncate } from "@/lib/format";

interface Product {
  id: string;
  titleAr: string;
  titleEn: string | null;
  price: number;
  currency: string;
  unit: string;
  quantity: number;
  status: string;
  featured: boolean;
  organic: boolean;
  views: number;
  governorate: string;
  createdAt: string;
  seller: { id: string; name: string | null; email: string };
  category: { nameAr: string; nameEn: string };
  _count: { orderItems: number; reviews: number };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const STATUSES = ["", "ACTIVE", "SOLD", "PAUSED", "DELETED"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/products?${params}`);
    const d = await res.json();
    if (d.success) { setProducts(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [search, status]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  async function changeStatus(id: string, newStatus: string) {
    setUpdating(id);
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await res.json();
    if (d.success) setProducts((p) => p.map((x) => x.id === id ? { ...x, status: newStatus } : x));
    setUpdating(null);
  }

  async function toggleFeatured(id: string, current: boolean) {
    setUpdating(id);
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !current }),
    });
    setProducts((p) => p.map((x) => x.id === id ? { ...x, featured: !current } : x));
    setUpdating(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Products</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} total products</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1", minWidth: "200px", height: "34px" }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "34px" }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Views</th>
              <th>Orders</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No products found</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: "500", color: "var(--text)" }}>{truncate(p.titleAr, 40)}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.governorate}</div>
                </td>
                <td style={{ fontSize: "12px" }}>{p.seller.name || p.seller.email}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.category.nameAr}</td>
                <td style={{ color: "var(--primary-hover)", fontSize: "12px" }}>{formatCurrency(p.price, p.currency)}</td>
                <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{p.views}</td>
                <td style={{ textAlign: "center" }}>{p._count.orderItems}</td>
                <td>
                  <span className={`${statusColors[p.status] || "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleFeatured(p.id, p.featured)}
                    disabled={updating === p.id}
                    style={{
                      background: "none", border: "none",
                      fontSize: "16px", cursor: "pointer",
                      opacity: updating === p.id ? 0.5 : 1,
                    }}
                    title={p.featured ? "Remove from featured" : "Mark as featured"}
                  >
                    {p.featured ? "⭐" : "☆"}
                  </button>
                </td>
                <td>
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus(p.id, e.target.value)}
                    disabled={updating === p.id}
                    style={{ padding: "3px 6px", height: "26px", fontSize: "11px" }}
                  >
                    {["ACTIVE", "PAUSED", "DELETED"].map((s) => <option key={s} value={s}>{s}</option>)}
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
            <button key={p} onClick={() => fetchProducts(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
