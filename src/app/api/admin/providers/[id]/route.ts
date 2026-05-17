import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const body = await req.json();
    const sms = await prisma.smsProvider.findUnique({ where: { id: params.id } });
    if (sms) {
      await prisma.smsProvider.update({ where: { id: params.id }, data: body });
    } else {
      await prisma.smmProvider.update({ where: { id: params.id }, data: body });
    }
    return NextResponse.json({ message: "Provider berhasil diupdate" });
  } catch (error) {
    console.error("Update provider error:", error);
    return NextResponse.json({ error: "Gagal mengupdate provider" }, { status: 500 });
  }
}
