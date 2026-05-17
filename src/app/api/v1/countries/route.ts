import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";

const countries = [
  { id: "id", name: "Indonesia", flag: "🇮🇩", code: "+62" },
  { id: "us", name: "United States", flag: "🇺🇸", code: "+1" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { id: "in", name: "India", flag: "🇮🇳", code: "+91" },
  { id: "ru", name: "Russia", flag: "🇷🇺", code: "+7" },
  { id: "ph", name: "Philippines", flag: "🇵🇭", code: "+63" },
  { id: "my", name: "Malaysia", flag: "🇲🇾", code: "+60" },
  { id: "th", name: "Thailand", flag: "🇹🇭", code: "+66" },
  { id: "vn", name: "Vietnam", flag: "🇻🇳", code: "+84" },
  { id: "sg", name: "Singapore", flag: "🇸🇬", code: "+65" },
  { id: "br", name: "Brazil", flag: "🇧🇷", code: "+55" },
  { id: "de", name: "Germany", flag: "🇩🇪", code: "+49" },
  { id: "fr", name: "France", flag: "🇫🇷", code: "+33" },
  { id: "nl", name: "Netherlands", flag: "🇳🇱", code: "+31" },
  { id: "cn", name: "China", flag: "🇨🇳", code: "+86" },
];

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  return NextResponse.json({ countries });
}
