import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const listing = await prisma.landListing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, email: true, phone: true } },
      inquiries: {
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { inquiries: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: listing });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { status?: string };
  const { status } = body;

  const allowed: Record<string, string> = {};
  if (status && ["ACTIVE", "WITHDRAWN", "SOLD", "RENTED"].includes(status)) {
    allowed.status = status;
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const listing = await prisma.landListing.update({ where: { id }, data: allowed });

  await logAudit({
    adminId: session.id,
    adminEmail: session.email,
    action: "LAND_LISTING_STATUS_CHANGE",
    target: `landListing:${id}`,
    details: `Updated status to ${status}`,
  });

  return NextResponse.json({ success: true, data: listing });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.landListing.delete({ where: { id } });

  await logAudit({
    adminId: session.id,
    adminEmail: session.email,
    action: "LAND_LISTING_DELETE",
    target: `landListing:${id}`,
    details: `Hard deleted land listing ${id}`,
  });

  return NextResponse.json({ success: true });
}
