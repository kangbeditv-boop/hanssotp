import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const referrals = await prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        totalTopup: 0,
        commission: 0,
      })),
    });
  } catch (error) {
    console.error("Get referrals error:", error);
    return NextResponse.json({ referrals: [] });
  }
}
