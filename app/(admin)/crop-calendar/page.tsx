"use client";

import { useEffect, useState, useCallback } from "react";

interface CropEntry {
  id: string;
  cropNameAr: string;
  cropNameEn: string | null;
  governorate: string;
  plantMonth: number;
  harvestMonth: number;
  notes: string | null;
  createdAt: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const GOVERNORATES = [
  "damascus", "aleppo", "homs", "hama", "latakia", "tartus",
  "deir-ez-zor", "raqqa", "hasakah", "daraa", "sweida", "quneitra", "idlib", "rif-dimashq",
];

const BLANK_FORM = { cropNameAr: "", cropNameEn: "", governorate: "damascus", plantMonth: "3", harvestMonth: "7", notes: "" };

export default function CropCalendarPage() {
  const [entries, setEntries] = useState<CropEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (governorate) params.set("governorate", governorate);
    const res = await fetch(`/api/crop-calendar?${params}`);
    const d = await res.json();
    if (d.success) { setEntries(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [search, governorate]);

  useEffect(() => { fetchEntries(1); }, [fetchEntries]);

  function startEdit(entry: CropEntry) {
    setEditId(entry.id);
    setForm({ cropNameAr: entry.cropNameAr, cropNameEn: entry.cropNameEn || "", governorate: entry.governorate, plantMonth: String(entry.plantMonth), harvestMonth: String(entry.harvestMonth), notes: entry.notes || "" });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(BLANK_FORM);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const body = { cropNameAr: form.cropNameAr, cropNameEn: form.cropNameEn || undefined, governorate: form.governorate, plantMonth: +form.plantMonth, harvestMonth: +form.harvestMonth, notes: form.notes || undefined };

    const url = editId ? `/api/crop-calendar/${editId}` : "/api/crop-calendar";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) {
      cancelForm();
      fetchEntries(pagination.page);
    } else {
      alert(d.error || "Failed to save");
    }
    setSubmitting(false);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/crop-calendar/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) setEntries((e) => e.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Crop Calendar</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} entries</p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(true); }} style={{ padding: "7px 14px", background: "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
          + Add Entry
        </button>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "600", color: "var(--text)" }}>{editId ? "Edit Entry" : "Add Crop Entry"}</h2>
          <form onSubmit={submitForm}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Crop Name (Arabic) *</label>
                <input value={form.cropNameAr} onChange={(e) => setForm({ ...form, cropNameAr: e.target.value })} required style={{ width: "100%", height: "34px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Crop Name (English)</label>
                <input value={form.cropNameEn} onChange={(e) => setForm({ ...form, cropNameEn: e.target.value })} style={{ width: "100%", height: "34px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Governorate *</label>
                <select value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} style={{ width: "100%", height: "34px" }}>
                  {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Plant Month *</label>
                <select value={form.plantMonth} onChange={(e) => setForm({ ...form, plantMonth: e.target.value })} style={{ width: "100%", height: "34px" }}>
                  {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Harvest Month *</label>
                <select value={form.harvestMonth} onChange={(e) => setForm({ ...form, harvestMonth: e.target.value })} style={{ width: "100%", height: "34px" }}>
                  {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: "100%", height: "34px" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={submitting} style={{ padding: "7px 16px", background: "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", cursor: "pointer" }}>{submitting ? "Saving…" : editId ? "Save Changes" : "Add Entry"}</button>
              <button type="button" onClick={cancelForm} style={{ padding: "7px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <input type="search" placeholder="Search crop…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1", minWidth: "200px", height: "34px" }} />
        <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} style={{ height: "34px" }}>
          <option value="">All governorates</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Crop (AR)</th>
              <th>Crop (EN)</th>
              <th>Governorate</th>
              <th>Plant</th>
              <th>Harvest</th>
              <th>Duration</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No entries found</td></tr>
            ) : entries.map((entry) => {
              const duration = ((entry.harvestMonth - entry.plantMonth + 12) % 12) || 12;
              return (
                <tr key={entry.id}>
                  <td style={{ fontWeight: "500" }}>{entry.cropNameAr}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{entry.cropNameEn || "—"}</td>
                  <td style={{ fontSize: "12px" }}>{entry.governorate}</td>
                  <td>
                    <span style={{ background: "rgba(46,160,67,0.15)", color: "var(--primary-hover)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                      {MONTHS[entry.plantMonth - 1]}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: "rgba(227,179,65,0.15)", color: "var(--warning)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                      {MONTHS[entry.harvestMonth - 1]}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>{duration} mo</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{entry.notes || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEdit(entry)} style={{ padding: "3px 8px", background: "rgba(88,166,255,0.15)", border: "1px solid rgba(88,166,255,0.4)", borderRadius: "4px", color: "var(--link)", fontSize: "12px", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => deleteEntry(entry.id)} style={{ padding: "3px 8px", background: "rgba(218,54,51,0.15)", border: "1px solid rgba(218,54,51,0.4)", borderRadius: "4px", color: "#f85149", fontSize: "12px", cursor: "pointer" }}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchEntries(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
