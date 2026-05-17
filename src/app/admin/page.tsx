"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, ShoppingCart, Phone, TrendingUp, Activity } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0, todayRevenue: 0, pendingOrders: 0, activeNumbers: 0, totalTransactions: 0, monthlyRevenue: 0,
  });

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      if (d.stats) setStats(d.stats);
    }).catch(() => {});
  }, []);

  const cards = [
    { title: "Total User", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Omset Hari Ini", value: formatRupiah(stats.todayRevenue), icon: DollarSign, color: "text-green-500" },
    { title: "Order Pending", value: stats.pendingOrders, icon: ShoppingCart, color: "text-yellow-500" },
    { title: "Nomor Aktif", value: stats.activeNumbers, icon: Phone, color: "text-purple-500" },
    { title: "Total Transaksi", value: stats.totalTransactions, icon: TrendingUp, color: "text-orange-500" },
    { title: "Omset Bulan Ini", value: formatRupiah(stats.monthlyRevenue), icon: Activity, color: "text-pink-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview sistem dan statistik</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
