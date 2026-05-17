import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key tidak ditemukan" }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id: params.id } });

    await createAuditLog({
      userId: user.id,
      action: "DELETE_API_KEY",
      entity: "ApiKey",
      entityId: params.id,
      details: `Deleted API key: ${apiKey.name}`,
    });

    return NextResponse.json({ message: "API key berhasil dihapus" });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json({ error: "Gagal menghapus API key" }, { status: 500 });
  }
}
