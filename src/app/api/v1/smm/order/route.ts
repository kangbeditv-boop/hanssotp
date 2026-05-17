import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { service, link, quantity } = await req.json();
    if (!service || !link || !quantity) {
      return NextResponse.json({ error: "Service, link, dan quantity diperlukan" }, { status: 400 });
    }

    const smmService = await prisma.smmService.findFirst({
      where: { id: service, isActive: true },
      include: { provider: true },
    });

    if (!smmService) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }

    if (quantity < smmService.minQty || quantity > smmService.maxQty) {
      return NextResponse.json({ error: `Quantity harus antara ${smmService.minQty} - ${smmService.maxQty}` }, { status: 400 });
    }

    const charge = (Number(smmService.rate) * quantity / 1000) * (1 + Number(smmService.provider.markupPercent || 0) / 100);

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || Number(wallet.balance) < charge) {
      return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 });
    }

    const currentBalance = wallet.balance;
    const newBalance = Number(currentBalance) - charge;

    const order = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "PURCHASE",
          amount: charge,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `SMM Order - ${smmService.name}`,
        },
      });

      return await tx.smmOrder.create({
        data: {
          userId: user.id,
          serviceId: smmService.id,
          providerId: smmService.providerId,
          link,
          quantity,
          charge,
          status: "PENDING",
        },
      });
    });

    await createAuditLog({
      userId: user.id,
      action: "SMM_ORDER",
      entity: "SmmOrder",
      entityId: order.id,
      details: `Ordered ${smmService.name} x${quantity}`,
    });

    return NextResponse.json({
      order: {
        id: order.id,
        service: smmService.name,
        link: order.link,
        quantity: order.quantity,
        charge: order.charge,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("SMM order error:", error);
    return NextResponse.json({ error: "Gagal membuat order SMM" }, { status: 500 });
  }
}
