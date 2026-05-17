import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const vouchers = await prisma.voucher.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      amount: v.amount,
      used: v.isUsed,
      createdAt: v.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { amount } = await req.json();
    if (!amount || amount < 10000) {
      return NextResponse.json({ error: "Minimum nominal voucher Rp 10.000" }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 });
    }

    const code = `HS-${randomBytes(4).toString("hex").toUpperCase()}`;

    const voucher = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: amount } },
      });

      return await tx.voucher.create({
        data: {
          code,
          amount,
          userId: user.id,
          isUsed: false,
        },
      });
    });

    return NextResponse.json({
      voucher: {
        id: voucher.id,
        code: voucher.code,
        amount: voucher.amount,
        used: false,
        createdAt: voucher.createdAt,
      },
    });
  } catch (error) {
    console.error("Create voucher error:", error);
    return NextResponse.json({ error: "Gagal membuat voucher" }, { status: 500 });
  }
}
