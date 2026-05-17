import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";
import { calculateBonus } from "@/lib/utils/format";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { amount } = await req.json();
    if (!amount || amount < 50000) {
      return NextResponse.json({ error: "Minimum top up Rp 50.000" }, { status: 400 });
    }

    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bonus = calculateBonus(amount);
    const totalAmount = amount + bonus;

    const topup = await prisma.topup.create({
      data: {
        userId: user.id,
        amount,
        bonusAmount: bonus,
        totalAmount,
        invoiceId,
        status: "PENDING",
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE_TOPUP",
      entity: "Topup",
      entityId: topup.id,
      details: `Created topup invoice for ${amount}`,
    });

    return NextResponse.json({
      invoice_id: invoiceId,
      amount,
      bonus,
      payment_url: `https://pakasir.id/pay/${invoiceId}`,
      qris_url: `https://pakasir.id/qris/${invoiceId}`,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Topup error:", error);
    return NextResponse.json({ error: "Gagal membuat invoice" }, { status: 500 });
  }
}
