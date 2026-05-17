"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ShoppingCart, History, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils/format";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ balance: 0, totalOrders: 0, activeOrders: 0, totalTopup: 0 });

  useEffect(() => {
    fetch("/api/v1/balance").then(r => r.json()).then(d => {
      if (d.balance !== undefined) setStats(prev => ({ ...prev, balance: d.balance }));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {session?.user?.name || "User"}!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatRupiah(stats.balance)}</div>
            <Link href="/dashboard/topup" className="text-xs text-muted-foreground hover:text-primary">Top up saldo &rarr;</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Order</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Semua order OTP</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Order Aktif</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">Menunggu OTP</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Top Up</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.totalTopup)}</div>
            <p className="text-xs text-muted-foreground">Total deposit</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Aksi Cepat</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between" asChild><Link href="/dashboard/orders">Beli Nomor OTP <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button className="w-full justify-between" variant="outline" asChild><Link href="/dashboard/topup">Top Up Saldo <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button className="w-full justify-between" variant="outline" asChild><Link href="/dashboard/smm">SMM Panel <ArrowRight className="h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Info Akun</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{session?.user?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge variant="secondary">{session?.user?.role || "USER"}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-green-500">Aktif</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
