"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/format";

interface Conversation {
  id: string;
  buyer: { id: string; name: string | null; email: string };
  seller: { id: string; name: string | null; email: string };
  product: { id: string; titleAr: string } | null;
  _count: { messages: number };
  messages: Array<{ content: string; createdAt: string }>;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { name: string | null; email: string };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConversations = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/messages?${params}`);
    const d = await res.json();
    if (d.data) { setConversations(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchConversations(1); }, [fetchConversations]);

  async function viewMessages(convId: string) {
    setSelectedConv(convId);
    setMessagesLoading(true);
    const res = await fetch(`/api/messages/${convId}`);
    const d = await res.json();
    setMessages(d.data || []);
    setMessagesLoading(false);
  }

  const panelStyle: React.CSSProperties = {
    position: "fixed", right: 0, top: 0, bottom: 0, width: "420px",
    background: "var(--surface)", borderLeft: "1px solid var(--border)",
    display: "flex", flexDirection: "column", zIndex: 100,
    boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Conversations</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} total conversations</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <input
          type="search"
          placeholder="Search by buyer or seller name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1", height: "34px" }}
        />
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Product</th>
              <th style={{ textAlign: "center" }}>Messages</th>
              <th>Last Message</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : conversations.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No conversations found</td></tr>
            ) : conversations.map((c) => (
              <tr key={c.id} style={{ background: selectedConv === c.id ? "rgba(46,160,67,0.06)" : undefined }}>
                <td>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text)" }}>{c.buyer.name || "—"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.buyer.email}</div>
                </td>
                <td>
                  <div style={{ fontSize: "13px", color: "var(--text)" }}>{c.seller.name || "—"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.seller.email}</div>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.product?.titleAr || <span style={{ opacity: 0.5 }}>General</span>}</td>
                <td style={{ textAlign: "center" }}>
                  <span style={{ background: "rgba(88,166,255,0.15)", color: "#58a6ff", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                    {c._count.messages}
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.messages[0]?.content || "—"}
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDateTime(c.updatedAt)}</td>
                <td>
                  <button
                    onClick={() => viewMessages(c.id)}
                    style={{ padding: "3px 10px", background: "rgba(88,166,255,0.12)", border: "1px solid rgba(88,166,255,0.3)", borderRadius: "4px", color: "#58a6ff", fontSize: "12px", cursor: "pointer" }}
                  >
                    View
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
            <button key={p} onClick={() => fetchConversations(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}

      {/* Side panel */}
      {selectedConv && (
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text)" }}>Message Thread</h2>
            <button onClick={() => setSelectedConv(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messagesLoading ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "40px" }}>Loading messages…</div>
            ) : messages.length === 0 ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "40px" }}>No messages</div>
            ) : messages.map((m) => (
              <div key={m.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--accent)" }}>{m.sender.name || m.sender.email}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{formatDateTime(m.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", lineHeight: "1.5" }}>{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
