import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return NextResponse.json({ settings: map });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    await createAuditLog({
      userId: user.id,
      action: "UPDATE_SETTINGS",
      entity: "Setting",
      details: `Updated settings: ${Object.keys(body).join(", ")}`,
    });

    return NextResponse.json({ message: "Pengaturan berhasil disimpan" });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
