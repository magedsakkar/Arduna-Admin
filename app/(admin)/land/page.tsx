"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate, formatCurrency } from "@/lib/format";

interface LandListing {
  id: string;
  title: string;
  governorate: string;
  district: string;
  landType: string;
  listingType: string;
  areaDunum: number;
  totalPrice: number;
  currency: string;
  status: string;
  views: number;
  createdAt: string;
  seller: { id: string; name: string | null; email: string; phone: string | null };
  _count: { inquiries: number };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUSES = ["", "ACTIVE", "SOLD", "RENTED", "WITHDRAWN"];
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  SOLD: "مباع",
  RENTED: "مؤجر",
  WITHDRAWN: "مسحوب",
};
const STATUS_CLASSES: Record<string, string> = {
  ACTIVE: "bg-green-900 text-green-300",
  SOLD: "bg-gray-700 text-gray-300",
  RENTED: "bg-blue-900 text-blue-300",
  WITHDRAWN: "bg-red-900 text-red-300",
};

const LAND_TYPE_LABELS: Record<string, string> = {
  OLIVE_GROVE: "زيتون",
  PISTACHIO: "فستق",
  WHEAT_FIELD: "قمح",
  CITRUS: "حمضيات",
  APPLE_ORCHARD: "تفاح",
  GRAPE_VINEYARD: "عنب",
  CHERRY_ORCHARD: "كرز",
  FIG_ORCHARD: "تين",
  COTTON_FIELD: "قطن",
  VEGETABLE_FARM: "خضروات",
  MIXED_ORCHARD: "مختلط",
  GRAZING_LAND: "مرعى",
  BARE_LAND: "أرض فضاء",
  GREENHOUSE: "بيت محمي",
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  FOR_SALE: "للبيع",
  FOR_RENT: "للإيجار",
};

const GOVERNORATES = [
  "", "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية",
  "طرطوس", "إدلب", "دير الزور", "الرقة", "الحسكة", "درعا",
  "السويداء", "القنيطرة",
];

const LAND_TYPES = ["", ...Object.keys(LAND_TYPE_LABELS)];

export default function LandPage() {
  const [listings, setListings] = useState<LandListing[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [governorate, setGovernorate] = useState("");
  const [status, setStatus] = useState("");
  const [landType, setLandType] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, soldRented: 0, totalViews: 0 });

  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    if (governorate) params.set("governorate", governorate);
    if (landType) params.set("landType", landType);

    const res = await fetch(`/api/land?${params}`);
    const d = await res.json();
    if (d.success) {
      setListings(d.data);
      setMeta(d.meta);
    }
    setLoading(false);
  }, [status, governorate, landType]);

  // Fetch unfiltered stats separately
  useEffect(() => {
    fetch("/api/land?limit=100&page=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const all = d.data as LandListing[];
        const totalViews = all.reduce((sum, l) => sum + l.views, 0);
        setStats({
          total: d.meta.total,
          active: all.filter((l) => l.status === "ACTIVE").length,
          soldRented: all.filter((l) => l.status === "SOLD" || l.status === "RENTED").length,
          totalViews,
        });
      });
  }, []);

  useEffect(() => { fetchListings(1); }, [fetchListings]);

  async function changeStatus(id: string, newStatus: string) {
    setUpdating(id);
    const res = await fetch(`/api/land/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await res.json();
    if (d.success) {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));
    }
    setUpdating(null);
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this land listing permanently? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/land/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
    }
    setDeleting(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>
            Land Listings
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>
            {meta.total.toLocaleString()} total listings
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Listings", value: stats.total, color: "var(--text)" },
          { label: "Active", value: stats.active, color: "var(--primary-hover)" },
          { label: "Sold / Rented", value: stats.soldRented, color: "var(--text-muted)" },
          { label: "Total Views", value: stats.totalViews.toLocaleString(), color: "var(--link)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px 18px",
            }}
          >
            <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: "600", color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <select
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          style={{ height: "34px" }}
        >
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g || "All governorates"}</option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "34px" }}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? STATUS_LABELS[s] ?? s : "All statuses"}</option>
          ))}
        </select>

        <select value={landType} onChange={(e) => setLandType(e.target.value)} style={{ height: "34px" }}>
          {LAND_TYPES.map((t) => (
            <option key={t} value={t}>{t ? LAND_TYPE_LABELS[t] ?? t : "All types"}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Type</th>
              <th>Area (Dunum)</th>
              <th>Price</th>
              <th>Seller</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Views</th>
              <th style={{ textAlign: "center" }}>Inquiries</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Loading…
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No listings found
                </td>
              </tr>
            ) : listings.map((l) => (
              <tr key={l.id} style={{ opacity: deleting === l.id ? 0.4 : 1 }}>
                <td>
                  <div style={{ fontWeight: "500", color: "var(--text)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {LISTING_TYPE_LABELS[l.listingType] ?? l.listingType}
                  </div>
                </td>
                <td style={{ fontSize: "12px" }}>
                  <div>{l.governorate}</div>
                  <div style={{ color: "var(--text-muted)" }}>{l.district}</div>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {LAND_TYPE_LABELS[l.landType] ?? l.landType}
                </td>
                <td style={{ fontSize: "12px" }}>{l.areaDunum.toLocaleString()}</td>
                <td style={{ color: "var(--primary-hover)", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {formatCurrency(l.totalPrice, l.currency)}
                </td>
                <td style={{ fontSize: "12px" }}>
                  <div>{l.seller.name || l.seller.email}</div>
                  {l.seller.phone && (
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{l.seller.phone}</div>
                  )}
                </td>
                <td>
                  <span className={`${STATUS_CLASSES[l.status] ?? "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}>
                    {STATUS_LABELS[l.status] ?? l.status}
                  </span>
                </td>
                <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  {l.views}
                </td>
                <td style={{ textAlign: "center", fontSize: "13px" }}>
                  {l._count.inquiries}
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {formatDate(l.createdAt)}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select
                      value={l.status}
                      onChange={(e) => changeStatus(l.id, e.target.value)}
                      disabled={updating === l.id}
                      style={{ padding: "3px 6px", height: "26px", fontSize: "11px" }}
                    >
                      {STATUSES.filter(Boolean).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteListing(l.id)}
                      disabled={deleting === l.id}
                      style={{
                        padding: "3px 8px",
                        height: "26px",
                        background: "transparent",
                        border: "1px solid #f85149",
                        borderRadius: "4px",
                        color: "#f85149",
                        fontSize: "11px",
                        cursor: "pointer",
                        opacity: deleting === l.id ? 0.5 : 1,
                      }}
                      title="Delete listing permanently"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(meta.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchListings(p)}
              style={{
                width: "32px",
                height: "32px",
                background: p === meta.page ? "var(--primary)" : "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: p === meta.page ? "#fff" : "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
