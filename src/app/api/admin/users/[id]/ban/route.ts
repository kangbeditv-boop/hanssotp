import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(admin.role)) return forbidden();

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const newStatus = !targetUser.isBanned;
    await prisma.user.update({ where: { id: params.id }, data: { isBanned: newStatus } });

    await createAuditLog({
      userId: admin.id,
      action: newStatus ? "BAN_USER" : "UNBAN_USER",
      entity: "User",
      entityId: params.id,
      details: `${newStatus ? "Banned" : "Unbanned"} user ${targetUser.email}`,
    });

    return NextResponse.json({ message: newStatus ? "User berhasil di-ban" : "User berhasil di-unban" });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json({ error: "Gagal mengubah status user" }, { status: 500 });
  }
}
