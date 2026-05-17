import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: `${k.key.slice(0, 8)}${"*".repeat(24)}`,
      lastUsed: k.lastUsedAt,
      createdAt: k.createdAt,
      isActive: k.isActive,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nama key diperlukan" }, { status: 400 });
    }

    const keyValue = `hsotp_${randomBytes(32).toString("hex")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        key: keyValue,
        encryptedKey: keyValue,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE_API_KEY",
      entity: "ApiKey",
      entityId: apiKey.id,
      details: `Created API key: ${name}`,
    });

    return NextResponse.json({
      key: {
        id: apiKey.id,
        name: apiKey.name,
        key: keyValue,
        lastUsed: null,
        createdAt: apiKey.createdAt,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ error: "Gagal membuat API key" }, { status: 500 });
  }
}
