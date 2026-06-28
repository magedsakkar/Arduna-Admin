export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number | string, currency = "SYP"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "—";
  return `${n.toLocaleString("en-US")} ${currency}`;
}

export function truncate(text: string, maxLen = 60): string {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export const roleColors: Record<string, string> = {
  ADMIN: "bg-red-900 text-red-300",
  MODERATOR: "bg-orange-900 text-orange-300",
  FARMER: "bg-green-900 text-green-300",
  BUYER: "bg-blue-900 text-blue-300",
  EXPERT: "bg-purple-900 text-purple-300",
};

export const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-900 text-green-300",
  SOLD: "bg-gray-700 text-gray-300",
  PAUSED: "bg-yellow-900 text-yellow-300",
  DELETED: "bg-red-900 text-red-300",
  PENDING: "bg-yellow-900 text-yellow-300",
  CONFIRMED: "bg-blue-900 text-blue-300",
  PROCESSING: "bg-blue-900 text-blue-300",
  SHIPPED: "bg-purple-900 text-purple-300",
  DELIVERED: "bg-green-900 text-green-300",
  CANCELLED: "bg-red-900 text-red-300",
  REFUNDED: "bg-gray-700 text-gray-300",
  COMPLETED: "bg-green-900 text-green-300",
  FAILED: "bg-red-900 text-red-300",
  PUBLISHED: "bg-green-900 text-green-300",
  HIDDEN: "bg-yellow-900 text-yellow-300",
};

export const severityColors: Record<string, string> = {
  LOW: "bg-blue-900 text-blue-300",
  MEDIUM: "bg-yellow-900 text-yellow-300",
  HIGH: "bg-orange-900 text-orange-300",
  CRITICAL: "bg-red-900 text-red-300",
};
