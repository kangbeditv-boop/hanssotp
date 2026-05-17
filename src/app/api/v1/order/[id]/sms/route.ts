import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const order = await prisma.otpOrder.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      sms_code: order.smsCode,
      number: order.phoneNumber,
      expires_at: order.expiresAt,
    });
  } catch (error) {
    console.error("Check OTP error:", error);
    return NextResponse.json({ error: "Gagal mengecek OTP" }, { status: 500 });
  }
}
