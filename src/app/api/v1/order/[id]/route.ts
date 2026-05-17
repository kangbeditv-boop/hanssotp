import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const order = await prisma.otpOrder.findFirst({
      where: { id: params.id, userId: user.id, status: "WAITING" },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan atau sudah selesai" }, { status: 404 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet tidak ditemukan" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.otpOrder.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      const currentBalance = wallet.balance;
      const newBalance = Number(currentBalance) + Number(order.price);

      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: order.price,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Refund cancel order #${order.id.slice(0, 8)}`,
        },
      });
    });

    await createAuditLog({
      userId: user.id,
      action: "CANCEL_ORDER",
      entity: "OtpOrder",
      entityId: order.id,
      details: `Cancelled order and refunded ${order.price}`,
    });

    return NextResponse.json({ message: "Order berhasil dibatalkan, saldo dikembalikan" });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Gagal membatalkan order" }, { status: 500 });
  }
}
