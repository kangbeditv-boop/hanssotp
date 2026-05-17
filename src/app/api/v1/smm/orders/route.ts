import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const orders = await prisma.smmOrder.findMany({
      where: { userId: user.id },
      include: { service: { select: { name: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        service: o.service.name,
        link: o.link,
        quantity: o.quantity,
        status: o.status,
        charge: o.charge,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get SMM orders error:", error);
    return NextResponse.json({ orders: [] });
  }
}
