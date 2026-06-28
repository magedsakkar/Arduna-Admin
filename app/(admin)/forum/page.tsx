"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate, statusColors, truncate } from "@/lib/format";

interface ForumPost {
  id: string;
  titleAr: string;
  category: string;
  status: string;
  pinned: boolean;
  solved: boolean;
  views: number;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
  _count: { replies: number };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const CATEGORIES = ["", "CROP_DISEASES", "IRRIGATION", "SOIL", "LIVESTOCK", "MACHINERY", "MARKET_PRICES", "WEATHER", "GENERAL", "ADVICE"];
const POST_STATUSES = ["", "PUBLISHED", "HIDDEN", "DELETED"];

const categoryLabels: Record<string, string> = {
  CROP_DISEASES: "Crop Diseases", IRRIGATION: "Irrigation", SOIL: "Soil",
  LIVESTOCK: "Livestock", MACHINERY: "Machinery", MARKET_PRICES: "Market Prices",
  WEATHER: "Weather", GENERAL: "General", ADVICE: "Advice",
};

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    const res = await fetch(`/api/forum?${params}`);
    const d = await res.json();
    if (d.success) { setPosts(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [search, status, category]);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  async function updatePost(id: string, data: object) {
    setUpdating(id);
    const res = await fetch(`/api/forum/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (d.success) {
      setPosts((p) => p.map((x) => x.id === id ? { ...x, ...data } : x));
    }
    setUpdating(null);
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Forum</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} posts</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input type="search" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1", minWidth: "200px", height: "34px" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "34px" }}>
          {POST_STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ height: "34px" }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabels[c] || "All categories"}</option>)}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Category</th>
              <th>Replies</th>
              <th>Views</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No posts found</td></tr>
            ) : posts.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: "500" }}>{truncate(p.titleAr, 45)}</div>
                  <div style={{ fontSize: "11px", gap: "6px", display: "flex", marginTop: "2px" }}>
                    {p.pinned && <span style={{ color: "var(--warning)" }}>📌 Pinned</span>}
                    {p.solved && <span style={{ color: "var(--primary-hover)" }}>✓ Solved</span>}
                  </div>
                </td>
                <td style={{ fontSize: "12px" }}>{p.author.name || p.author.email}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{categoryLabels[p.category] || p.category}</td>
                <td style={{ textAlign: "center" }}>{p._count.replies}</td>
                <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{p.views}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(p.createdAt)}</td>
                <td>
                  <span className={`${statusColors[p.status] || "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => updatePost(p.id, { pinned: !p.pinned })}
                      disabled={updating === p.id}
                      title={p.pinned ? "Unpin" : "Pin"}
                      style={{ padding: "2px 6px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "4px", color: p.pinned ? "var(--warning)" : "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}
                    >
                      📌
                    </button>
                    {p.status === "PUBLISHED" ? (
                      <button onClick={() => updatePost(p.id, { status: "HIDDEN" })} disabled={updating === p.id} style={{ padding: "2px 6px", background: "rgba(227,179,65,0.15)", border: "1px solid rgba(227,179,65,0.4)", borderRadius: "4px", color: "var(--warning)", fontSize: "12px", cursor: "pointer" }}>Hide</button>
                    ) : p.status === "HIDDEN" ? (
                      <button onClick={() => updatePost(p.id, { status: "PUBLISHED" })} disabled={updating === p.id} style={{ padding: "2px 6px", background: "rgba(46,160,67,0.15)", border: "1px solid rgba(46,160,67,0.4)", borderRadius: "4px", color: "var(--primary-hover)", fontSize: "12px", cursor: "pointer" }}>Show</button>
                    ) : null}
                    {p.status !== "DELETED" && (
                      <button onClick={() => confirm("Delete this post?") && updatePost(p.id, { status: "DELETED" })} disabled={updating === p.id} style={{ padding: "2px 6px", background: "rgba(218,54,51,0.15)", border: "1px solid rgba(218,54,51,0.4)", borderRadius: "4px", color: "#f85149", fontSize: "12px", cursor: "pointer" }}>Del</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchPosts(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
