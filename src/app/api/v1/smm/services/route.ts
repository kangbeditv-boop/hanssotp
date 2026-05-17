import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const services = await prisma.smmService.findMany({
      where: { isActive: true },
      include: { provider: { select: { name: true, markupPercent: true } } },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        rate: Number(s.rate) * (1 + Number(s.provider.markupPercent || 0) / 100),
        min: s.minQty,
        max: s.maxQty,
        provider: s.provider.name,
      })),
    });
  } catch (error) {
    console.error("Get SMM services error:", error);
    return NextResponse.json({ services: [] });
  }
}
