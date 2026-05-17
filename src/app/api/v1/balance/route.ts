import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  return NextResponse.json({
    balance: user.wallet?.balance || 0,
    currency: "IDR",
  });
}
