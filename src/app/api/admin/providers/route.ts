import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/middleware/auditLog";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const smsProviders = await prisma.smsProvider.findMany();
    const smmProviders = await prisma.smmProvider.findMany();

    const providers = [
      ...smsProviders.map((p) => ({ id: p.id, name: p.name, type: "SMS", apiUrl: p.baseUrl, isActive: p.isActive, balance: 0, markupPercent: p.markupPercent })),
      ...smmProviders.map((p) => ({ id: p.id, name: p.name, type: "SMM", apiUrl: p.url, isActive: p.isActive, balance: 0, markupPercent: p.markupPercent })),
    ];

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Admin providers error:", error);
    return NextResponse.json({ providers: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const { name, type, apiUrl, apiKey, markupPercent } = await req.json();

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (type === "SMM") {
      const provider = await prisma.smmProvider.create({
        data: { name, slug, url: apiUrl, apiKey, isActive: true, markupPercent: markupPercent || 10 },
      });
      await createAuditLog({ userId: user.id, action: "CREATE_PROVIDER", entity: "SmmProvider", entityId: provider.id, details: `Created SMM provider: ${name}` });
      return NextResponse.json({ provider: { id: provider.id, name, type: "SMM", apiUrl, isActive: true, balance: 0, markupPercent } });
    } else {
      const provider = await prisma.smsProvider.create({
        data: { name, slug, baseUrl: apiUrl, apiKey, isActive: true, markupPercent: markupPercent || 10 },
      });
      await createAuditLog({ userId: user.id, action: "CREATE_PROVIDER", entity: "SmsProvider", entityId: provider.id, details: `Created SMS provider: ${name}` });
      return NextResponse.json({ provider: { id: provider.id, name, type: "SMS", apiUrl, isActive: true, balance: 0, markupPercent } });
    }
  } catch (error) {
    console.error("Create provider error:", error);
    return NextResponse.json({ error: "Gagal membuat provider" }, { status: 500 });
  }
}
