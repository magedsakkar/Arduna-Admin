"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate, severityColors } from "@/lib/format";

interface Alert {
  id: string;
  titleAr: string;
  contentAr: string;
  type: string;
  severity: string;
  governorates: string[];
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  author: { id: string; name: string | null };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const ALERT_TYPES = ["PEST", "DISEASE", "WEATHER", "MARKET", "GENERAL"];
const ALERT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const GOVERNORATES = [
  "damascus", "aleppo", "homs", "hama", "latakia", "tartus",
  "deir-ez-zor", "raqqa", "hasakah", "daraa", "sweida", "quneitra", "idlib", "rif-dimashq",
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ titleAr: "", contentAr: "", type: "GENERAL", severity: "LOW", governorates: [] as string[], expiresAt: "" });

  const fetchAlerts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (activeFilter !== "") params.set("active", activeFilter);
    const res = await fetch(`/api/alerts?${params}`);
    const d = await res.json();
    if (d.success) { setAlerts(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => { fetchAlerts(1); }, [fetchAlerts]);

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    const d = await res.json();
    if (d.success) setAlerts((a) => a.map((x) => x.id === id ? { ...x, active: !current } : x));
  }

  async function deleteAlert(id: string) {
    if (!confirm("Delete this alert?")) return;
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) setAlerts((a) => a.filter((x) => x.id !== id));
  }

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined }),
    });
    const d = await res.json();
    if (d.success) {
      setShowForm(false);
      setForm({ titleAr: "", contentAr: "", type: "GENERAL", severity: "LOW", governorates: [], expiresAt: "" });
      fetchAlerts(1);
    } else {
      alert(d.error || "Failed to create alert");
    }
    setSubmitting(false);
  }

  const typeIcons: Record<string, string> = { PEST: "🦗", DISEASE: "🦠", WEATHER: "🌩️", MARKET: "📊", GENERAL: "📢" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Alerts</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} alerts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: "7px 14px", background: "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}
        >
          + New Alert
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "600", color: "var(--text)" }}>Create Alert</h2>
          <form onSubmit={createAlert}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Title (Arabic)</label>
                <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} required style={{ width: "100%", height: "34px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", height: "34px" }}>
                  {ALERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Severity</label>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} style={{ width: "100%", height: "34px" }}>
                  {ALERT_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Expires At</label>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={{ width: "100%", height: "34px" }} />
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Content (Arabic)</label>
              <textarea value={form.contentAr} onChange={(e) => setForm({ ...form, contentAr: e.target.value })} required rows={3} style={{ width: "100%", resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Governorates</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {GOVERNORATES.map((g) => (
                  <label key={g} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.governorates.includes(g)}
                      onChange={(e) => setForm({ ...form, governorates: e.target.checked ? [...form.governorates, g] : form.governorates.filter((x) => x !== g) })}
                      style={{ width: "auto", height: "auto" }}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={submitting} style={{ padding: "7px 16px", background: "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", cursor: "pointer" }}>
                {submitting ? "Creating…" : "Create Alert"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "7px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[["", "All"], ["true", "Active"], ["false", "Inactive"]].map(([v, l]) => (
          <button key={v} onClick={() => setActiveFilter(v)} style={{ padding: "5px 12px", background: activeFilter === v ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", color: activeFilter === v ? "#fff" : "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px" }}>Loading…</p>
        ) : alerts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px" }}>No alerts found</p>
        ) : alerts.map((a) => (
          <div
            key={a.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
              borderLeft: `3px solid ${a.severity === "CRITICAL" ? "#da3633" : a.severity === "HIGH" ? "#e3b341" : "var(--border)"}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span>{typeIcons[a.type] || "📢"}</span>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{a.titleAr}</h3>
                  <span className={`${severityColors[a.severity] || ""} text-xs px-2 py-0.5 rounded-full`}>{a.severity}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--surface-2)", padding: "1px 6px", borderRadius: "4px" }}>{a.type}</span>
                  {!a.active && <span style={{ fontSize: "11px", color: "#f85149" }}>INACTIVE</span>}
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{a.contentAr}</p>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                  {a.governorates.length > 0 && <span>📍 {a.governorates.join(", ")}</span>}
                  <span>By: {a.author.name || "—"}</span>
                  <span>{formatDate(a.createdAt)}</span>
                  {a.expiresAt && <span>Expires: {formatDate(a.expiresAt)}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => toggleActive(a.id, a.active)}
                  style={{ padding: "4px 10px", background: a.active ? "rgba(218,54,51,0.15)" : "rgba(46,160,67,0.15)", border: `1px solid ${a.active ? "rgba(218,54,51,0.4)" : "rgba(46,160,67,0.4)"}`, borderRadius: "4px", color: a.active ? "#f85149" : "var(--primary-hover)", fontSize: "12px", cursor: "pointer" }}
                >
                  {a.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteAlert(a.id)}
                  style={{ padding: "4px 10px", background: "rgba(218,54,51,0.15)", border: "1px solid rgba(218,54,51,0.4)", borderRadius: "4px", color: "#f85149", fontSize: "12px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
