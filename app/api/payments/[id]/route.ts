import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id }, include: { order: true } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "COMPLETED") {
    return NextResponse.json({ error: "هذه الدفعة تمت الموافقة عليها مسبقاً" }, { status: 409 });
  }

  if (action === "approve") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: "COMPLETED", verifiedAt: new Date(), verifiedBy: session.id },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "COMPLETED", status: "CONFIRMED" },
      }),
    ]);

    await prisma.notification.create({
      data: {
        userId: payment.userId,
        titleAr: "تم تأكيد الدفع ✅",
        messageAr: `تم التحقق من دفعتك بقيمة ${Number(payment.amount).toLocaleString()} ${payment.currency}.`,
        type: "PAYMENT",
        link: "/orders",
      },
    }).catch(() => {});
  } else {
    await prisma.payment.update({ where: { id }, data: { status: "FAILED" } });

    await prisma.notification.create({
      data: {
        userId: payment.userId,
        titleAr: "فشل التحقق من الدفع ❌",
        messageAr: "لم نتمكن من التحقق من دفعتك. يرجى التواصل مع الدعم.",
        type: "PAYMENT",
        link: "/orders",
      },
    }).catch(() => {});

    await prisma.notification.create({
      data: {
        userId: payment.order.sellerId,
        titleAr: "فشل التحقق من الدفع",
        messageAr: `فشل التحقق من دفعة الطلب #${payment.order.orderNumber}. يرجى التواصل مع المشتري.`,
        type: "PAYMENT",
        link: "/dashboard",
      },
    }).catch(() => {});
  }

  await logAudit({
    adminId: session.id,
    adminEmail: session.email,
    action: action === "approve" ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
    target: `payment:${id}`,
    details: `Payment ${id} for order ${payment.orderId} — ${action}`,
  });

  return NextResponse.json({ success: true });
}
