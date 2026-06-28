"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/format";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  product: { id: string; titleAr: string };
  user: { id: string; name: string | null; email: string };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ letterSpacing: "1px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? "#e3b341" : "var(--border)", fontSize: "14px" }}>★</span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [ratingFilter, setRatingFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (ratingFilter) params.set("rating", ratingFilter);
    const res = await fetch(`/api/reviews?${params}`);
    const d = await res.json();
    if (d.success) { setReviews(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [ratingFilter]);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  async function deleteReview(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setDeleting(id);
    const res = await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    if (d.success) setReviews((r) => r.filter((x) => x.id !== id));
    else alert(d.error || "Failed to delete");
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Reviews</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} total reviews</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} style={{ height: "34px" }}>
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={String(r)}>{r} Star{r !== 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No reviews found</td></tr>
            ) : reviews.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.product.titleAr}</div>
                </td>
                <td>
                  <div style={{ fontSize: "13px", color: "var(--text)" }}>{r.user.name || "—"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.user.email}</div>
                </td>
                <td><Stars rating={r.rating} /></td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.comment || <span style={{ opacity: 0.4 }}>No comment</span>}
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(r.createdAt)}</td>
                <td>
                  <button
                    onClick={() => deleteReview(r.id)}
                    disabled={deleting === r.id}
                    style={{ padding: "3px 10px", background: "rgba(248,81,73,0.12)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: "4px", color: "#f85149", fontSize: "12px", cursor: "pointer" }}
                  >
                    {deleting === r.id ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchReviews(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
