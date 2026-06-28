"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/format";

const GOVERNORATES = [
  "دمشق", "ريف دمشق", "حلب", "حمص", "حماة", "اللاذقية",
  "طرطوس", "السويداء", "درعا", "القنيطرة", "دير الزور",
  "الرقة", "الحسكة", "إدلب",
];

interface WeatherEntry {
  id: string;
  governorate: string;
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  rainfall: number | null;
  windSpeed: number | null;
  description: string | null;
  descriptionAr: string | null;
}

const emptyForm = () => ({
  governorate: "", date: "", tempMin: "", tempMax: "",
  humidity: "", rainfall: "", windSpeed: "", description: "", descriptionAr: "",
});

export default function WeatherPage() {
  const [entries, setEntries] = useState<WeatherEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [govFilter, setGovFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (govFilter) params.set("governorate", govFilter);
    const res = await fetch(`/api/weather?${params}`);
    const d = await res.json();
    setEntries(d.data || []);
    setLoading(false);
  }, [govFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function startEdit(e: WeatherEntry) {
    setEditId(e.id);
    setForm({
      governorate: e.governorate,
      date: e.date.slice(0, 10),
      tempMin: String(e.tempMin),
      tempMax: String(e.tempMax),
      humidity: String(e.humidity),
      rainfall: e.rainfall != null ? String(e.rainfall) : "",
      windSpeed: e.windSpeed != null ? String(e.windSpeed) : "",
      description: e.description || "",
      descriptionAr: e.descriptionAr || "",
    });
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    setError("");
  }

  async function saveEntry(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.governorate || !form.date || !form.tempMin || !form.tempMax || !form.humidity) {
      setError("Governorate, date, temperatures and humidity are required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.data) {
      await fetchData();
      cancelForm();
    } else {
      setError(d.error || "Failed to save");
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this weather entry?")) return;
    setDeleting(id);
    await fetch("/api/weather", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setEntries((e) => e.filter((x) => x.id !== id));
    setDeleting(null);
  }

  const inputStyle: React.CSSProperties = { height: "34px", width: "100%", padding: "0 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "13px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Weather Data</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{entries.length} entries</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm()); setError(""); }}
          style={{ padding: "7px 16px", background: "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: "500" }}
        >
          {showForm ? "Cancel" : "+ Add Weather Data"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveEntry} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{editId ? "Edit Entry" : "Add Weather Data"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Governorate *</label>
              <select value={form.governorate} onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))} style={{ ...inputStyle }}>
                <option value="">Select…</option>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Min Temp °C *</label>
              <input type="number" value={form.tempMin} onChange={(e) => setForm((f) => ({ ...f, tempMin: e.target.value }))} placeholder="15" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Max Temp °C *</label>
              <input type="number" value={form.tempMax} onChange={(e) => setForm((f) => ({ ...f, tempMax: e.target.value }))} placeholder="28" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Humidity % *</label>
              <input type="number" min="0" max="100" value={form.humidity} onChange={(e) => setForm((f) => ({ ...f, humidity: e.target.value }))} placeholder="60" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Rainfall mm</label>
              <input type="number" min="0" value={form.rainfall} onChange={(e) => setForm((f) => ({ ...f, rainfall: e.target.value }))} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Wind Speed km/h</label>
              <input type="number" min="0" value={form.windSpeed} onChange={(e) => setForm((f) => ({ ...f, windSpeed: e.target.value }))} placeholder="10" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Description (EN)</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Partly cloudy" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Description (AR)</label>
              <input value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} placeholder="غائم جزئياً" dir="rtl" style={inputStyle} />
            </div>
          </div>
          {error && <p style={{ color: "#f85149", fontSize: "12px", margin: "0 0 12px 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={saving} style={{ padding: "7px 16px", background: "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "13px", cursor: "pointer" }}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={cancelForm} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <select value={govFilter} onChange={(e) => setGovFilter(e.target.value)} style={{ height: "34px" }}>
          <option value="">All governorates</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Governorate</th>
              <th>Date</th>
              <th>Min °C</th>
              <th>Max °C</th>
              <th>Humidity %</th>
              <th>Rainfall mm</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No weather data. Add entries above.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id}>
                <td style={{ fontWeight: "500", color: "var(--text)" }} dir="rtl">{e.governorate}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(e.date)}</td>
                <td style={{ color: "#58a6ff" }}>{e.tempMin}°</td>
                <td style={{ color: "#f85149" }}>{e.tempMax}°</td>
                <td style={{ color: "var(--text-muted)" }}>{e.humidity}%</td>
                <td style={{ color: "var(--text-muted)" }}>{e.rainfall ?? "—"}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }} dir="rtl">{e.descriptionAr || e.description || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => startEdit(e)} style={{ padding: "3px 8px", background: "rgba(88,166,255,0.12)", border: "1px solid rgba(88,166,255,0.3)", borderRadius: "4px", color: "#58a6ff", fontSize: "12px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteEntry(e.id)} disabled={deleting === e.id} style={{ padding: "3px 8px", background: "rgba(248,81,73,0.12)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: "4px", color: "#f85149", fontSize: "12px", cursor: "pointer" }}>{deleting === e.id ? "…" : "Delete"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
