"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/products", label: "Products", icon: "🌽" },
  { href: "/land", label: "Land Listings", icon: "🗺️" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/payments", label: "Payments", icon: "💳" },
  { href: "/forum", label: "Forum", icon: "🗣️" },
  { href: "/alerts", label: "Alerts", icon: "🚨" },
  { href: "/crop-calendar", label: "Crop Calendar", icon: "📅" },
  { href: "/messages", label: "Conversations", icon: "💬" },
  { href: "/reviews", label: "Reviews", icon: "⭐" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/weather", label: "Weather Data", icon: "🌤️" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/audit", label: "Audit Log", icon: "📋" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "240px" : "56px",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: "56px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: sidebarOpen ? "0 16px" : "0",
            justifyContent: sidebarOpen ? "space-between" : "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🌾</span>
              <span style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px", whiteSpace: "nowrap" }}>
                Arduna Admin
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "16px",
              padding: "4px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: sidebarOpen ? "8px 16px" : "8px",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  textDecoration: "none",
                  borderRadius: "6px",
                  margin: "1px 8px",
                  background: active ? "var(--primary-muted)" : "transparent",
                  color: active ? "var(--primary-hover)" : "var(--text-muted)",
                  fontWeight: active ? "500" : "400",
                  transition: "background 0.1s, color 0.1s",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span style={{ fontSize: "15px", flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: sidebarOpen ? "12px 16px" : "12px 8px",
            flexShrink: 0,
          }}
        >
          {user && sidebarOpen && (
            <div style={{ marginBottom: "8px" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name || user.email}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: sidebarOpen ? "6px 12px" : "6px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: "6px",
            }}
          >
            <span>↩</span>
            {sidebarOpen && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div
          style={{
            height: "56px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            flexShrink: 0,
            gap: "8px",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {NAV_ITEMS.find((n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)))?.label || "Arduna Admin"}
          </span>
        </div>

        {/* Page */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
