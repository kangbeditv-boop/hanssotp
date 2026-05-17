import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Password lama dan baru diperlukan" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.password) {
      return NextResponse.json({ error: "Akun tidak menggunakan password" }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
  }
}
