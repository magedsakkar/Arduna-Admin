"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

interface UserOption { id: string; name: string | null; email: string }
interface NotifHistory {
  id: string;
  titleAr: string;
  messageAr: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<"send" | "history">("send");
  const [targetMode, setTargetMode] = useState<"all" | "specific">("all");
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [history, setHistory] = useState<NotifHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Search users as user types
  useEffect(() => {
    if (targetMode !== "specific" || userSearch.length < 2) { setUserOptions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/notifications?search=${encodeURIComponent(userSearch)}`);
      const d = await res.json();
      setUserOptions(d.data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, targetMode]);

  useEffect(() => {
    if (tab !== "history") return;
    setHistoryLoading(true);
    fetch("/api/notifications?type=history")
      .then((r) => r.json())
      .then((d) => { setHistory(d.data || []); })
      .finally(() => setHistoryLoading(false));
  }, [tab]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) { setResult({ type: "error", text: "Title and message are required" }); return; }
    if (targetMode === "specific" && !selectedUser) { setResult({ type: "error", text: "Please select a user" }); return; }

    setSending(true);
    setResult(null);
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetMode === "specific" ? selectedUser?.id : null, title, message, type, link: link || null }),
    });
    const d = await res.json();
    if (d.success) {
      setResult({ type: "success", text: `Sent to ${d.sent} user${d.sent !== 1 ? "s" : ""} ✓` });
      setTitle(""); setMessage(""); setLink(""); setSelectedUser(null); setUserSearch("");
    } else {
      setResult({ type: "error", text: d.error || "Failed to send" });
    }
    setSending(false);
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", background: active ? "var(--primary)" : "transparent",
    border: "1px solid " + (active ? "var(--primary)" : "var(--border)"),
    borderRadius: "6px", color: active ? "#fff" : "var(--text-muted)",
    fontSize: "13px", cursor: "pointer", fontWeight: active ? "500" : "400",
  });

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Notifications</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>Broadcast or send targeted notifications to users</p>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button style={tabStyle(tab === "send")} onClick={() => setTab("send")}>Send Notification</button>
        <button style={tabStyle(tab === "history")} onClick={() => setTab("history")}>History</button>
      </div>

      {tab === "send" && (
        <div style={{ maxWidth: "560px" }}>
          <form onSubmit={handleSend}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Target */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>Target</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={() => setTargetMode("all")} style={{ ...tabStyle(targetMode === "all"), flex: 1 }}>All Users</button>
                  <button type="button" onClick={() => setTargetMode("specific")} style={{ ...tabStyle(targetMode === "specific"), flex: 1 }}>Specific User</button>
                </div>
                {targetMode === "specific" && (
                  <div style={{ marginTop: "10px", position: "relative" }}>
                    {selectedUser ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(46,160,67,0.1)", border: "1px solid rgba(46,160,67,0.3)", borderRadius: "6px" }}>
                        <span style={{ flex: 1, fontSize: "13px", color: "var(--text)" }}>{selectedUser.name || selectedUser.email}</span>
                        <button type="button" onClick={() => { setSelectedUser(null); setUserSearch(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="search"
                          placeholder="Search user by name or email…"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          style={{ width: "100%", height: "36px" }}
                        />
                        {userOptions.length > 0 && (
                          <div style={{ position: "absolute", top: "38px", left: 0, right: 0, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", zIndex: 10, overflow: "hidden" }}>
                            {userOptions.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => { setSelectedUser(u); setUserSearch(""); setUserOptions([]); }}
                                style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", color: "var(--text)", fontSize: "13px", textAlign: "left", cursor: "pointer", display: "block" }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                                onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                              >
                                <span style={{ fontWeight: "500" }}>{u.name || "—"}</span>
                                <span style={{ color: "var(--text-muted)", marginLeft: "8px", fontSize: "12px" }}>{u.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Title (Arabic)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإشعار…" style={{ width: "100%", height: "36px" }} dir="rtl" required />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Message (Arabic)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="نص الإشعار…" style={{ width: "100%", height: "80px", resize: "vertical", padding: "8px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "13px" }} dir="rtl" required />
              </div>

              {/* Type */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ height: "36px", width: "100%" }}>
                  {["SYSTEM", "ORDER", "PAYMENT", "ALERT", "FORUM"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Link */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>Link (optional)</label>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/orders or /forum/..." style={{ width: "100%", height: "36px" }} />
              </div>

              {result && (
                <div style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "13px", background: result.type === "success" ? "rgba(46,160,67,0.12)" : "rgba(248,81,73,0.12)", border: `1px solid ${result.type === "success" ? "rgba(46,160,67,0.4)" : "rgba(248,81,73,0.4)"}`, color: result.type === "success" ? "#3fb950" : "#f85149" }}>
                  {result.text}
                </div>
              )}

              <button type="submit" disabled={sending} style={{ padding: "9px 20px", background: sending ? "rgba(46,160,67,0.5)" : "var(--primary)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "500", cursor: sending ? "not-allowed" : "pointer" }}>
                {sending ? "Sending…" : targetMode === "all" ? "📢 Broadcast to All Users" : "📩 Send to User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "history" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Title</th>
                <th>Message</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No system notifications sent yet</td></tr>
              ) : history.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div style={{ fontSize: "13px", color: "var(--text)" }}>{n.user.name || "—"}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{n.user.email}</div>
                  </td>
                  <td style={{ fontSize: "13px", fontWeight: "500", color: "var(--text)" }} dir="rtl">{n.titleAr}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} dir="rtl">{n.messageAr}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDateTime(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
