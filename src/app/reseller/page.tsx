"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Gift, Copy, Plus, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

export default function ResellerPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ totalRevenue: 0, totalReferrals: 0, commission: 0, tier: "REGULER" });
  const [vouchers, setVouchers] = useState<Array<{ id: string; code: string; amount: number; used: boolean; createdAt: string }>>([]);
  const [referrals, setReferrals] = useState<Array<{ id: string; name: string; email: string; totalTopup: number; commission: number }>>([]);
  const [voucherAmount, setVoucherAmount] = useState(50000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/reseller/stats").then(r => r.json()).then(d => { if (d.stats) setStats(d.stats); }).catch(() => {});
    fetch("/api/v1/reseller/vouchers").then(r => r.json()).then(d => setVouchers(d.vouchers || [])).catch(() => {});
    fetch("/api/v1/reseller/referrals").then(r => r.json()).then(d => setReferrals(d.referrals || [])).catch(() => {});
  }, []);

  const handleCreateVoucher = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/reseller/vouchers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: voucherAmount }),
      });
      const data = await res.json();
      if (data.voucher) setVouchers(prev => [data.voucher, ...prev]);
    } catch {}
    setLoading(false);
  };

  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${session?.user?.id || ""}` : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Reseller</h1>
        <p className="text-muted-foreground">Kelola bisnis reseller Anda</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tier</CardTitle></CardHeader><CardContent><Badge className="text-lg">{stats.tier}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Omset</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatRupiah(stats.totalRevenue)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Referral</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5" />{stats.totalReferrals}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Komisi</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatRupiah(stats.commission)}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Link Referral</CardTitle><CardDescription>Bagikan link ini untuk mendapatkan komisi</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly />
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(referralLink)}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="vouchers">
        <TabsList>
          <TabsTrigger value="vouchers"><Gift className="h-4 w-4 mr-2" />Voucher</TabsTrigger>
          <TabsTrigger value="referrals"><Users className="h-4 w-4 mr-2" />Referral</TabsTrigger>
          <TabsTrigger value="upgrade"><TrendingUp className="h-4 w-4 mr-2" />Upgrade Tier</TabsTrigger>
        </TabsList>
        <TabsContent value="vouchers" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Buat Voucher</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="space-y-2"><Label>Nominal</Label><Input type="number" min={10000} value={voucherAmount} onChange={e => setVoucherAmount(Number(e.target.value))} /></div>
                <Button onClick={handleCreateVoucher} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Buat</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Daftar Voucher</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nominal</TableHead><TableHead>Status</TableHead><TableHead>Tanggal</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vouchers.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono">{v.code}</TableCell>
                      <TableCell>{formatRupiah(v.amount)}</TableCell>
                      <TableCell><Badge className={v.used ? "bg-gray-500" : "bg-green-500"}>{v.used ? "Terpakai" : "Aktif"}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(v.createdAt).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(v.code)}><Copy className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {vouchers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada voucher</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="referrals">
          <Card>
            <CardHeader><CardTitle>Daftar Referral</CardTitle><CardDescription>User yang mendaftar menggunakan link referral Anda</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Total Topup</TableHead><TableHead>Komisi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {referrals.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{formatRupiah(r.totalTopup)}</TableCell>
                      <TableCell className="text-green-600">{formatRupiah(r.commission)}</TableCell>
                    </TableRow>
                  ))}
                  {referrals.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada referral</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upgrade">
          <Card>
            <CardHeader><CardTitle>Upgrade Tier</CardTitle><CardDescription>Tingkatkan tier untuk mendapatkan diskon lebih besar</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Reguler", min: "Rp 0", discount: "0%" },
                { name: "Silver", min: "Rp 100.000", discount: "5%" },
                { name: "Gold", min: "Rp 500.000", discount: "10%" },
                { name: "Platinum", min: "Rp 2.000.000", discount: "15%" },
                { name: "VIP Reseller", min: "Manual Approve", discount: "20%" },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div><p className="font-medium">{t.name}</p><p className="text-sm text-muted-foreground">Min. saldo: {t.min}</p></div>
                  <div className="text-right"><Badge className="bg-primary">{t.discount}</Badge><p className="text-xs text-muted-foreground mt-1">diskon</p></div>
                </div>
              ))}
              <Button className="w-full">Ajukan VIP Reseller</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
