import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createHmac } from "crypto";
import { calculateBonus } from "@/lib/utils/format";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.PAKASIR_SECRET_KEY || "";
  const hash = createHmac("sha256", secret).update(body).digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-pakasir-signature") || "";

    if (process.env.PAKASIR_SECRET_KEY && !verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(rawBody);
    const { invoice_id, status, amount: paidAmount } = data;

    if (status !== "paid") {
      return NextResponse.json({ message: "Ignored non-paid status" });
    }

    const topup = await prisma.topup.findFirst({
      where: { invoiceId: invoice_id, status: "PENDING" },
      include: { user: { include: { wallet: true } } },
    });

    if (!topup) {
      return NextResponse.json({ error: "Topup not found" }, { status: 404 });
    }

    const wallet = topup.user.wallet;
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const creditAmount = Number(topup.totalAmount);
    const currentBalance = wallet.balance;
    const newBalance = Number(currentBalance) + creditAmount;

    await prisma.$transaction(async (tx) => {
      await tx.topup.update({
        where: { id: topup.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          amount: creditAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Top up saldo via Pakasir - ${invoice_id}`,
          referenceId: topup.id,
          referenceType: "TOPUP",
        },
      });
    });

    return NextResponse.json({ message: "Payment processed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
