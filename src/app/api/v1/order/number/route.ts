import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { country, service } = await req.json();
    if (!country || !service) {
      return NextResponse.json({ error: "Country dan service diperlukan" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || Number(wallet.balance) < 3000) {
      return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 });
    }

    const price = 3000;
    const currentBalance = wallet.balance;
    const newBalance = Number(currentBalance) - price;

    let provider = await prisma.smsProvider.findFirst({ where: { isActive: true } });
    if (!provider) {
      provider = await prisma.smsProvider.create({
        data: {
          name: "HeroSMS",
          slug: "hero-sms",
          baseUrl: "https://hero-sms.com/api/v1",
          apiKey: process.env.HERO_SMS_API_KEY || "default",
          isActive: true,
          markupPercent: 15,
        },
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "PURCHASE",
          amount: price,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Beli nomor OTP - ${service} (${country})`,
          referenceType: "OTP_ORDER",
        },
      });

      return await tx.otpOrder.create({
        data: {
          userId: user.id,
          providerId: provider.id,
          country,
          service,
          phoneNumber: `+62${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          status: "WAITING",
          price,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
    });

    await createAuditLog({
      userId: user.id,
      action: "ORDER_NUMBER",
      entity: "OtpOrder",
      entityId: order.id,
      details: `Ordered ${service} number for ${country}`,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        country: order.country,
        service: order.service,
        number: order.phoneNumber,
        status: order.status,
        price: Number(order.price),
        smsCode: null,
        expiresAt: order.expiresAt,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ error: "Gagal membuat order" }, { status: 500 });
  }
}
