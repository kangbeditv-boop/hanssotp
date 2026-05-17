import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized, forbidden } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!["ADMIN", "SUPERADMIN"].includes(user.role)) return forbidden();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalUsers, pendingOrders, activeNumbers, todayTx, monthTx] = await Promise.all([
      prisma.user.count(),
      prisma.otpOrder.count({ where: { status: "WAITING" } }),
      prisma.otpOrder.count({ where: { status: "WAITING" } }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: today }, type: "PURCHASE" }, _sum: { amount: true }, _count: true }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: monthStart }, type: "PURCHASE" }, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        todayRevenue: todayTx._sum?.amount || 0,
        pendingOrders,
        activeNumbers,
        totalTransactions: todayTx._count || 0,
        monthlyRevenue: monthTx._sum?.amount || 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ stats: { totalUsers: 0, todayRevenue: 0, pendingOrders: 0, activeNumbers: 0, totalTransactions: 0, monthlyRevenue: 0 } });
  }
}
