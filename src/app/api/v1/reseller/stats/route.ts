import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  return NextResponse.json({
    stats: {
      totalRevenue: 0,
      totalReferrals: 0,
      commission: 0,
      tier: "REGULER",
    },
  });
}
