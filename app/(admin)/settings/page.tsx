"use client";

import { useEffect, useState } from "react";

interface DBHealth {
  connected: boolean;
  counts: {
    users: number; products: number; orders: number; payments: number;
    forumPosts: number; alerts: number; conversations: number; reviews: number; messages: number;
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [name, setName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [health, setHealth] = useState<DBHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setUser(d.user); setName(d.user.name || ""); }
      });
    fetch("/api/settings/health")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .finally(() => setHealthLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPw && newPw !== confirmPw) { setMessage({ type: "error", text: "New passwords do not match" }); return; }
    setSaving(true);
    const body: Record<string, string> = {};
    if (name !== user?.name) body.name = name;
    if (newPw) { body.currentPassword = currentPw; body.newPassword = newPw; }
    if (Object.keys(body).length === 0) { setMessage({ type: "error", text: "No changes to save" }); setSaving(false); return; }
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) {
      setMessage({ type: "success", text: "Settings saved successfully" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      if (body.name) setUser((u) => u ? { ...u, name: body.name } : u);
    } else {
      setMessage({ type: "error", text: d.error || "Failed to save" });
    }
    setSaving(false);
  }

  const msgStyle = (type: "success" | "error"): React.CSSProperties => ({
    background: type === "success" ? "rgba(46,160,67,0.12)" : "rgba(218,54,51,0.12)",
    border: `1px solid ${type === "success" ? "rgba(46,160,67,0.4)" : "rgba(218,54,51,0.4)"}`,
    borderRadius: "6px", padding: "10px 14px",
    color: type === "success" ? "var(--primary-hover)" : "#f85149", fontSize: "13px", marginBottom: "16px",
  });

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", marginBottom: "24px" }}>Settings</h1>

      {user && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(46,160,67,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0, color: "var(--accent)", fontWeight: "700" }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: "600", color: "var(--text)" }}>{user.name || "—"}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{user.email}</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--accent)" }}>{user.role}</p>
          </div>
        </div>
      )}

      {message && <div style={msgStyle(message.type)}>{message.text}</div>}

      <form onSubmit={saveProfile}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Profile</h2>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", height: "36px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Email</label>
            <input value={user?.email || ""} disabled style={{ width: "100%", height: "36px", opacity: 0.6 }} />
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Change Password</h2>
          <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-muted)" }}>Leave blank to keep current password</p>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Current Password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" style={{ width: "100%", height: "36px" }} />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" style={{ width: "100%", height: "36px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" style={{ width: "100%", height: "36px" }} />
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ padding: "8px 20px", background: saving ? "rgba(46,160,67,0.5)" : "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "500", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* DB Health */}
      <div style={{ marginTop: "28px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Database Health</h2>
          {!healthLoading && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: health?.connected ? "#3fb950" : "#f85149" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: health?.connected ? "#3fb950" : "#f85149", display: "inline-block" }} />
              {health?.connected ? "Connected" : "Disconnected"}
            </span>
          )}
        </div>
        {healthLoading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading…</p>
        ) : health?.connected ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {Object.entries(health.counts).map(([key, count]) => (
              <div key={key} style={{ background: "var(--bg)", borderRadius: "6px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent)" }}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#f85149", fontSize: "13px" }}>Could not connect to database</p>
        )}
      </div>

      {/* System Info */}
      <div style={{ marginTop: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>System Info</h2>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "13px" }}>
          <dt style={{ color: "var(--text-muted)" }}>Platform</dt><dd style={{ margin: 0, color: "var(--text)" }}>Arduna Admin v1.0</dd>
          <dt style={{ color: "var(--text-muted)" }}>Framework</dt><dd style={{ margin: 0, color: "var(--text)" }}>Next.js (App Router)</dd>
          <dt style={{ color: "var(--text-muted)" }}>Database</dt><dd style={{ margin: 0, color: "var(--text)" }}>PostgreSQL 16 (Prisma ORM)</dd>
          {user && <><dt style={{ color: "var(--text-muted)" }}>Logged in as</dt><dd style={{ margin: 0, color: "var(--text)" }}>{user.email} ({user.role})</dd></>}
        </dl>
      </div>
    </div>
  );
}
