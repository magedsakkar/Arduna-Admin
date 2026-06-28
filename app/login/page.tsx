"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "340px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1b4332, #2d6a4f)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              marginBottom: "12px",
            }}
          >
            🌾
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--text)",
              margin: "0 0 4px 0",
            }}
          >
            Arduna Admin
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
            Sign in to your admin account
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          {error && (
            <div
              style={{
                background: "rgba(218, 54, 51, 0.12)",
                border: "1px solid rgba(218, 54, 51, 0.4)",
                borderRadius: "6px",
                padding: "10px 12px",
                color: "#f85149",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "var(--text)",
                  marginBottom: "6px",
                }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@arduna.sy"
                style={{ width: "100%", height: "36px" }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "var(--text)",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", height: "36px" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "36px",
                background: loading ? "var(--primary-muted)" : "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "500",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
            marginTop: "16px",
          }}
        >
          Restricted to Admin & Moderator accounts only
        </p>
      </div>
    </div>
  );
}
