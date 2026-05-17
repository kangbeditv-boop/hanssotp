import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const users = await prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name || "",
        email: u.email || "",
        role: u.role,
        balance: u.wallet?.balance || 0,
        status: u.isBanned ? "BANNED" : "ACTIVE",
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ users: [] });
  }
}
