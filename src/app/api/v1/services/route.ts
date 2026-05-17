import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";

const servicesMap: Record<string, Array<{ id: string; name: string; price: number }>> = {
  id: [
    { id: "wa", name: "WhatsApp", price: 3000 },
    { id: "tg", name: "Telegram", price: 2500 },
    { id: "fb", name: "Facebook", price: 3500 },
    { id: "ig", name: "Instagram", price: 4000 },
    { id: "tw", name: "Twitter/X", price: 3000 },
    { id: "tt", name: "TikTok", price: 3500 },
    { id: "go", name: "Google/Gmail", price: 5000 },
    { id: "sh", name: "Shopee", price: 2000 },
    { id: "tk", name: "Tokopedia", price: 2000 },
    { id: "gj", name: "Gojek", price: 3000 },
    { id: "gr", name: "Grab", price: 3000 },
    { id: "da", name: "DANA", price: 2500 },
    { id: "ov", name: "OVO", price: 2500 },
  ],
  us: [
    { id: "wa", name: "WhatsApp", price: 15000 },
    { id: "tg", name: "Telegram", price: 12000 },
    { id: "fb", name: "Facebook", price: 18000 },
    { id: "ig", name: "Instagram", price: 20000 },
    { id: "go", name: "Google/Gmail", price: 25000 },
  ],
};

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const country = req.nextUrl.searchParams.get("country") || "id";
  const services = servicesMap[country] || servicesMap["id"];

  return NextResponse.json({ services, country });
}
