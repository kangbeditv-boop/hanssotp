import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const orders = await prisma.otpOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        country: o.country,
        service: o.service,
        number: o.phoneNumber,
        status: o.status,
        smsCode: o.smsCode,
        price: o.price,
        createdAt: o.createdAt,
        expiresAt: o.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Gagal mengambil orders" }, { status: 500 });
  }
}
