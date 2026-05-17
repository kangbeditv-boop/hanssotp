import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["RESELLER", "USER"] } },
      include: { wallet: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      requests: users.map((u) => ({
        id: u.id,
        userName: u.name || "",
        email: u.email || "",
        currentTier: u.role === "RESELLER" ? "RESELLER" : "REGULER",
        requestedTier: "VIP",
        balance: u.wallet?.balance || 0,
        status: u.role === "RESELLER" ? "APPROVED" : "PENDING",
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin resellers error:", error);
    return NextResponse.json({ requests: [] });
  }
}
