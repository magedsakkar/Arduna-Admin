import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_JWT_SECRET || "arduna-admin-jwt-secret";
const COOKIE = "arduna.admin.session";
const EXPIRY = "8h";

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, SECRET) as AdminPayload;
    if (!["ADMIN", "MODERATOR"].includes(decoded.role)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string): { name: string; value: string; options: object } {
  return {
    name: COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  };
}

export const ADMIN_COOKIE = COOKIE;
