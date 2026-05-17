import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const transactions = await prisma.transaction.findMany({
      include: { wallet: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        userId: t.wallet.userId,
        userName: t.wallet.user.name || t.wallet.user.email || "",
        type: t.type,
        amount: t.amount,
        description: t.description,
        status: "SUCCESS",
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin transactions error:", error);
    return NextResponse.json({ transactions: [] });
  }
}
