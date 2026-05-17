"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, QrCode, Loader2 } from "lucide-react";
import { formatRupiah, calculateBonus } from "@/lib/utils/format";

const presetAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function TopupPage() {
  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [qrisUrl, setQrisUrl] = useState("");
  const bonus = calculateBonus(amount);

  const handleTopup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.payment_url) setPaymentUrl(data.payment_url);
      if (data.qris_url) setQrisUrl(data.qris_url);
    } catch (error) {
      console.error("Topup error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Top Up Saldo</h1>
        <p className="text-muted-foreground">Isi saldo untuk mulai menggunakan layanan</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Pilih Nominal</CardTitle>
            <CardDescription>Minimum top up Rp 50.000</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {presetAmounts.map((a) => (
                <Button key={a} variant={amount === a ? "default" : "outline"} onClick={() => setAmount(a)} className="h-auto py-3 flex flex-col">
                  <span className="font-bold">{formatRupiah(a)}</span>
                  {calculateBonus(a) > 0 && <span className="text-xs opacity-75">+{formatRupiah(calculateBonus(a))}</span>}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Nominal Custom</Label>
              <Input type="number" min={50000} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            {bonus > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Bonus saldo: <strong>{formatRupiah(bonus)}</strong></p>
              </div>
            )}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between"><span>Nominal</span><span className="font-bold">{formatRupiah(amount)}</span></div>
              <div className="flex justify-between"><span>Bonus</span><span className="font-bold text-green-600">+{formatRupiah(bonus)}</span></div>
              <div className="flex justify-between text-lg"><span className="font-bold">Total Saldo</span><span className="font-bold text-primary">{formatRupiah(amount + bonus)}</span></div>
            </div>
            <Button className="w-full" size="lg" onClick={handleTopup} disabled={loading || amount < 50000}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</> : <><CreditCard className="mr-2 h-4 w-4" />Bayar Sekarang</>}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />Metode Pembayaran</CardTitle>
            <CardDescription>Pilih metode pembayaran yang tersedia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentUrl ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Klik tombol di bawah untuk melanjutkan pembayaran:</p>
                <Button className="w-full" asChild><a href={paymentUrl} target="_blank" rel="noopener noreferrer">Buka Halaman Pembayaran</a></Button>
                {qrisUrl && (
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">Atau scan QRIS:</p>
                    <div className="inline-block p-4 bg-white rounded-lg"><img src={qrisUrl} alt="QRIS" className="w-48 h-48" /></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg"><QrCode className="h-5 w-5" /><div><p className="font-medium">QRIS</p><p className="text-xs text-muted-foreground">Scan &amp; bayar instan</p></div></div>
                <div className="flex items-center gap-3 p-3 border rounded-lg"><CreditCard className="h-5 w-5" /><div><p className="font-medium">Transfer Bank</p><p className="text-xs text-muted-foreground">BCA, BNI, BRI, Mandiri</p></div></div>
                <div className="flex items-center gap-3 p-3 border rounded-lg"><Wallet className="h-5 w-5" /><div><p className="font-medium">E-Wallet</p><p className="text-xs text-muted-foreground">GoPay, OVO, DANA, ShopeePay</p></div></div>
              </div>
            )}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Bonus Top Up</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Rp 100.000+</span><Badge className="bg-green-500">+Rp 2.000</Badge></div>
                <div className="flex justify-between"><span>Rp 500.000+</span><Badge className="bg-green-500">+Rp 15.000</Badge></div>
                <div className="flex justify-between"><span>Rp 1.000.000+</span><Badge className="bg-green-500">+Rp 40.000</Badge></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
