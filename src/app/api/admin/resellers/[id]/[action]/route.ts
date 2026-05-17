import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function POST(req: NextRequest, { params }: { params: { id: string; action: string } }) {
  const admin = await getCurrentUser();
  if (!admin) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(admin.role)) return forbidden();

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (params.action === "approve") {
      await prisma.user.update({
        where: { id: params.id },
        data: { role: "RESELLER" },
      });
      await createAuditLog({
        userId: admin.id,
        action: "APPROVE_RESELLER",
        entity: "User",
        entityId: params.id,
        details: `Approved VIP reseller for ${targetUser.email}`,
      });
      return NextResponse.json({ message: "Reseller berhasil di-approve" });
    } else if (params.action === "reject") {
      await createAuditLog({
        userId: admin.id,
        action: "REJECT_RESELLER",
        entity: "User",
        entityId: params.id,
        details: `Rejected VIP reseller for ${targetUser.email}`,
      });
      return NextResponse.json({ message: "Permintaan reseller ditolak" });
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("Reseller action error:", error);
    return NextResponse.json({ error: "Gagal memproses permintaan" }, { status: 500 });
  }
}
