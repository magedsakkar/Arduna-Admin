"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDate, roleColors, truncate } from "@/lib/format";

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  governorate: string | null;
  verified: boolean;
  active: boolean;
  createdAt: string;
  _count: { products: number; orders: number };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const ROLES = ["", "ADMIN", "MODERATOR", "FARMER", "BUYER", "EXPERT"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (active !== "") params.set("active", active);
    const res = await fetch(`/api/users?${params}`);
    const d = await res.json();
    if (d.success) { setUsers(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [search, role, active]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  async function toggleActive(id: string, current: boolean) {
    setUpdating(id);
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !current }) });
    setUsers((u) => u.map((x) => x.id === id ? { ...x, active: !current } : x));
    setUpdating(null);
  }

  async function changeRole(id: string, newRole: string) {
    setUpdating(id);
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    const d = await res.json();
    if (d.success) setUsers((u) => u.map((x) => x.id === id ? { ...x, role: newRole } : x));
    else alert(d.error || "Failed to change role");
    setUpdating(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Users</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} total users</p>
        </div>
        <button
          onClick={async () => {
            const params = new URLSearchParams({ page: "1", limit: "1000" });
            if (search) params.set("search", search);
            if (role) params.set("role", role);
            if (active !== "") params.set("active", active);
            const res = await fetch(`/api/users?${params}`);
            const d = await res.json();
            if (!d.success) return;
            const rows: string[][] = [["id","name","email","role","governorate","phone","verified","active","createdAt"]];
            for (const u of d.data) rows.push([u.id, u.name || "", u.email, u.role, u.governorate || "", u.phone || "", String(u.verified), String(u.active), u.createdAt]);
            downloadCSV(rows, "users.csv");
          }}
          style={{ padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1", minWidth: "200px", height: "34px" }}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ height: "34px" }}>
          {ROLES.map((r) => <option key={r} value={r}>{r || "All roles"}</option>)}
        </select>
        <select value={active} onChange={(e) => setActive(e.target.value)} style={{ height: "34px" }}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Governorate</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link href={`/users/${u.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ fontWeight: "500", color: "var(--accent)" }}>{u.name || "—"}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{u.email}</div>
                  </Link>
                </td>
                <td>
                  <span
                    className={`${roleColors[u.role] || "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{u.governorate || "—"}</td>
                <td style={{ textAlign: "center" }}>{u._count.products}</td>
                <td style={{ textAlign: "center" }}>{u._count.orders}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{formatDate(u.createdAt)}</td>
                <td>
                  <span style={{ color: u.active ? "var(--primary-hover)" : "#f85149", fontSize: "12px" }}>
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => toggleActive(u.id, u.active)}
                      disabled={updating === u.id}
                      style={{
                        padding: "3px 8px",
                        background: u.active ? "rgba(218,54,51,0.15)" : "rgba(46,160,67,0.15)",
                        border: `1px solid ${u.active ? "rgba(218,54,51,0.4)" : "rgba(46,160,67,0.4)"}`,
                        borderRadius: "4px",
                        color: u.active ? "#f85149" : "var(--primary-hover)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={updating === u.id}
                      style={{ padding: "3px 6px", height: "26px", fontSize: "11px" }}
                    >
                      {["FARMER", "BUYER", "EXPERT", "MODERATOR", "ADMIN"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchUsers(p)}
              style={{
                width: "32px",
                height: "32px",
                background: p === pagination.page ? "var(--primary)" : "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: p === pagination.page ? "#fff" : "var(--text)",
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
