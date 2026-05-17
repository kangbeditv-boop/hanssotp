import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) return null;
  return await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { wallet: true },
  });
}

export async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const apiKey = await prisma.apiKey.findFirst({
    where: { key: token, isActive: true },
    include: { user: { include: { wallet: true } } },
  });

  if (!apiKey) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey.user;
}

export async function requireAuth(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (user) return user;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }
  return currentUser;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
