import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { name, email } = await req.json();
    await prisma.user.update({
      where: { id: user.id },
      data: { ...(name && { name }), ...(email && { email }) },
    });
    return NextResponse.json({ message: "Profil berhasil diupdate" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Gagal update profil" }, { status: 500 });
  }
}
