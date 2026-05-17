"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Search, Loader2, Copy, RefreshCw, X } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface OtpOrder {
  id: string;
  country: string;
  service: string;
  number: string;
  status: string;
  smsCode: string | null;
  price: number;
  createdAt: string;
  expiresAt: string;
}

export default function OrdersPage() {
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [orders, setOrders] = useState<OtpOrder[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/countries").then(r => r.json()).then(d => setCountries(d.countries || [])).catch(() => {});
    fetch("/api/v1/orders").then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetch(`/api/v1/services?country=${selectedCountry}`).then(r => r.json()).then(d => setServices(d.services || [])).catch(() => {});
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/order/${polling}/sms`);
        const data = await res.json();
        if (data.sms_code) {
          setOrders(prev => prev.map(o => o.id === polling ? { ...o, smsCode: data.sms_code, status: "RECEIVED" } : o));
          setPolling(null);
        }
      } catch {}
    }, 5000);
    const timeout = setTimeout(() => { setPolling(null); }, 300000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [polling]);

  const handleBuyNumber = async () => {
    if (!selectedCountry || !selectedService) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/order/number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry, service: selectedService }),
      });
      const data = await res.json();
      if (data.order) {
        setOrders(prev => [data.order, ...prev]);
        setPolling(data.order.id);
      }
    } catch (error) {
      console.error("Order error:", error);
    }
    setLoading(false);
  };

  const handleCancel = async (orderId: string) => {
    try {
      await fetch(`/api/v1/order/${orderId}`, { method: "DELETE" });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
      if (polling === orderId) setPolling(null);
    } catch {}
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = { PENDING: "bg-yellow-500", WAITING: "bg-blue-500", RECEIVED: "bg-green-500", CANCELLED: "bg-red-500", EXPIRED: "bg-gray-500" };
    return <Badge className={variants[status] || "bg-gray-500"}>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Beli Nomor OTP</h1>
        <p className="text-muted-foreground">Pilih negara dan layanan untuk mendapatkan nomor virtual</p>
      </div>
      <Tabs defaultValue="buy">
        <TabsList>
          <TabsTrigger value="buy">Beli Nomor</TabsTrigger>
          <TabsTrigger value="history">Riwayat Order</TabsTrigger>
        </TabsList>
        <TabsContent value="buy" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pilih Negara</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari negara..." className="pl-10" />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {countries.map(c => (
                      <Button key={c.id} variant={selectedCountry === c.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setSelectedCountry(c.id)}>
                        {c.name}
                      </Button>
                    ))}
                    {countries.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Memuat negara...</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Pilih Layanan</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {services.map(s => (
                    <Button key={s.id} variant={selectedService === s.id ? "default" : "ghost"} className="w-full justify-between" onClick={() => setSelectedService(s.id)}>
                      <span>{s.name}</span>
                      <span className="text-xs">{formatRupiah(s.price)}</span>
                    </Button>
                  ))}
                  {!selectedCountry && <p className="text-sm text-muted-foreground text-center py-4">Pilih negara terlebih dahulu</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Konfirmasi</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Negara</Label>
                  <p className="font-medium">{countries.find(c => c.id === selectedCountry)?.name || "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Layanan</Label>
                  <p className="font-medium">{services.find(s => s.id === selectedService)?.name || "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Harga</Label>
                  <p className="text-xl font-bold text-primary">{formatRupiah(services.find(s => s.id === selectedService)?.price || 0)}</p>
                </div>
                <Button className="w-full" size="lg" onClick={handleBuyNumber} disabled={loading || !selectedCountry || !selectedService}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</> : <><Phone className="mr-2 h-4 w-4" />Beli Nomor</>}
                </Button>
              </CardContent>
            </Card>
          </div>
          {polling && (
            <Card className="border-blue-500">
              <CardContent className="flex items-center gap-4 pt-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <div>
                  <p className="font-medium">Menunggu OTP masuk...</p>
                  <p className="text-sm text-muted-foreground">Polling setiap 5 detik, maksimal 5 menit</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Order</CardTitle>
              <CardDescription>Semua order nomor OTP Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Kode OTP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.number}</TableCell>
                      <TableCell>{order.service}</TableCell>
                      <TableCell>
                        {order.smsCode ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-green-600">{order.smsCode}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(order.smsCode || "")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatRupiah(order.price)}</TableCell>
                      <TableCell>
                        {order.status === "WAITING" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPolling(order.id)}><RefreshCw className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleCancel(order.id)}><X className="h-3 w-3" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada order</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
