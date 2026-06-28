import { promises as fs } from "fs";
import path from "path";

export type AuditEntry = {
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
};

const LOG_FILE = path.join(process.cwd(), "audit.log");

export async function logAudit(entry: Omit<AuditEntry, "timestamp">): Promise<void> {
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + "\n";
  await fs.appendFile(LOG_FILE, line).catch(() => {});
}

export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  try {
    const content = await fs.readFile(LOG_FILE, "utf-8");
    return content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as AuditEntry)
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
}
