"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/audit";

const actionColors: Record<string, string> = {
  PAYMENT_APPROVED: "#3fb950",
  PAYMENT_REJECTED: "#f85149",
  USER_UPDATED: "#58a6ff",
  PRODUCT_UPDATED: "#e3b341",
};

export default function AuditPage() {
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setLog(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? log.filter((e) => e.action.includes(filter) || e.adminEmail.includes(filter) || e.target.includes(filter))
    : log;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Audit Log</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>Last 200 admin actions — payments, role changes, product updates</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <input
          type="search"
          placeholder="Filter by action, admin, or target…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ flex: "1", height: "34px" }}
        />
        <button
          onClick={() => fetch("/api/audit").then((r) => r.json()).then((d) => setLog(d.data || []))}
          style={{ padding: "0 14px", height: "34px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>{filter ? "No matching entries" : "No audit log entries yet"}</td></tr>
            ) : filtered.map((e, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontSize: "13px", color: "var(--text)" }}>{e.adminEmail}</div>
                </td>
                <td>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                    fontFamily: "monospace",
                    background: `${actionColors[e.action] || "#7d8590"}20`,
                    color: actionColors[e.action] || "#7d8590",
                    border: `1px solid ${actionColors[e.action] || "#7d8590"}40`,
                  }}>
                    {e.action}
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{e.target}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.details}</td>
                <td style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(e.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", textAlign: "right" }}>
          Showing {filtered.length} of {log.length} entries (max 200 stored)
        </p>
      )}
    </div>
  );
}
