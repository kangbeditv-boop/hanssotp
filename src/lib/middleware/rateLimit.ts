import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(limit: number = 60, windowMs: number = 60000) {
  return (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now - record.lastReset > windowMs) {
      rateLimitMap.set(key, { count: 1, lastReset: now });
      return null;
    }

    if (record.count >= limit) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((windowMs - (now - record.lastReset)) / 1000)) } }
      );
    }

    record.count++;
    return null;
  };
}
