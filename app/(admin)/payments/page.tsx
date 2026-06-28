"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate, formatCurrency, statusColors } from "@/lib/format";

interface Payment {
  id: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  transactionRef: string | null;
  phoneNumber: string | null;
  bankName: string | null;
  receiptImage: string | null;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    buyer: { name: string | null; email: string; phone: string | null };
    seller: { name: string | null; email: string };
  };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

const PAYMENT_STATUSES = ["", "PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    const res = await fetch(`/api/payments?${params}`);
    const d = await res.json();
    if (d.success) { setPayments(d.data); setPagination(d.pagination); }
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchPayments(1); }, [fetchPayments]);

  async function handleAction(id: string, action: "approve" | "reject") {
    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} this payment?`)) return;
    setProcessing(id);
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    if (d.success) {
      setPayments((p) => p.filter((x) => x.id !== id));
    } else {
      alert(d.error || "Action failed");
    }
    setProcessing(null);
  }

  const methodLabels: Record<string, string> = {
    CASH_ON_DELIVERY: "Cash on Delivery",
    SYRIATEL_CASH: "Syriatel Cash",
    MTN_CASH: "MTN Cash",
    SHAM_CASH: "Sham Cash",
    BANK_TRANSFER: "Bank Transfer",
    USDT: "USDT",
    IN_PERSON: "In Person",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: 0 }}>Payments</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0 0" }}>{pagination.total.toLocaleString()} payments</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        {PAYMENT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              padding: "5px 12px",
              background: status === s ? "var(--primary)" : "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: status === s ? "#fff" : "var(--text-muted)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>No payments found</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>#{p.order.orderNumber}</td>
                <td>
                  <div style={{ fontSize: "13px" }}>{p.order.buyer.name || "—"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.order.buyer.phone || p.order.buyer.email}</div>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.order.seller.name || p.order.seller.email}</td>
                <td style={{ fontSize: "12px" }}>{methodLabels[p.method] || p.method}</td>
                <td style={{ color: "var(--primary-hover)", fontWeight: "500" }}>{formatCurrency(p.amount, p.currency)}</td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {p.transactionRef || p.phoneNumber || p.bankName || "—"}
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(p.createdAt)}</td>
                <td>
                  <span className={`${statusColors[p.status] || "bg-gray-700 text-gray-300"} text-xs px-2 py-0.5 rounded-full`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  {p.status === "PENDING" || p.status === "PROCESSING" ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleAction(p.id, "approve")}
                        disabled={processing === p.id}
                        style={{ padding: "3px 8px", background: "rgba(46,160,67,0.15)", border: "1px solid rgba(46,160,67,0.4)", borderRadius: "4px", color: "var(--primary-hover)", fontSize: "12px", cursor: "pointer" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleAction(p.id, "reject")}
                        disabled={processing === p.id}
                        style={{ padding: "3px 8px", background: "rgba(218,54,51,0.15)", border: "1px solid rgba(218,54,51,0.4)", borderRadius: "4px", color: "#f85149", fontSize: "12px", cursor: "pointer" }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {p.verifiedAt ? formatDate(p.verifiedAt) : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchPayments(p)} style={{ width: "32px", height: "32px", background: p === pagination.page ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: p === pagination.page ? "#fff" : "var(--text)", fontSize: "13px", cursor: "pointer" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
