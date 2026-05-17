"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Search, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface SmmService {
  id: string;
  name: string;
  category: string;
  rate: number;
  min: number;
  max: number;
  provider: string;
}

interface SmmOrder {
  id: string;
  service: string;
  link: string;
  quantity: number;
  status: string;
  charge: number;
  createdAt: string;
}

export default function SmmPage() {
  const [services, setServices] = useState<SmmService[]>([]);
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<SmmService | null>(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/smm/services").then(r => r.json()).then(d => setServices(d.services || [])).catch(() => {});
    fetch("/api/v1/smm/orders").then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => {});
  }, []);

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()));

  const handleOrder = async () => {
    if (!selectedService || !link) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/smm/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: selectedService.id, link, quantity }),
      });
      const data = await res.json();
      if (data.order) setOrders(prev => [data.order, ...prev]);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">SMM Panel</h1>
        <p className="text-muted-foreground">Order layanan sosial media marketing</p>
      </div>
      <Tabs defaultValue="order">
        <TabsList>
          <TabsTrigger value="order">Buat Order</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>
        <TabsContent value="order" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pilih Layanan</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari layanan..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Layanan</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Min/Max</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map(s => (
                          <TableRow key={s.id} className={selectedService?.id === s.id ? "bg-primary/10" : ""}>
                            <TableCell className="text-sm">{s.name}</TableCell>
                            <TableCell><Badge variant="secondary">{s.category}</Badge></TableCell>
                            <TableCell>{formatRupiah(s.rate)}</TableCell>
                            <TableCell className="text-xs">{s.min}-{s.max}</TableCell>
                            <TableCell><Button size="sm" variant={selectedService?.id === s.id ? "default" : "outline"} onClick={() => { setSelectedService(s); setQuantity(s.min); }}>Pilih</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Order</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {selectedService ? (
                  <>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">{selectedService.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedService.category}</p>
                    </div>
                    <div className="space-y-2"><Label>Link</Label><Input placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Jumlah ({selectedService.min}-{selectedService.max})</Label>
                      <Input type="number" min={selectedService.min} max={selectedService.max} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-primary">{formatRupiah(selectedService.rate * quantity / 1000)}</span></div>
                    </div>
                    <Button className="w-full" onClick={handleOrder} disabled={loading || !link}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Order Sekarang
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Pilih layanan terlebih dahulu</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Riwayat Order SMM</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Biaya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                      <TableCell>{o.service}</TableCell>
                      <TableCell className="max-w-32 truncate">{o.link}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell><Badge className={o.status === "COMPLETED" ? "bg-green-500" : o.status === "PROCESSING" ? "bg-blue-500" : "bg-yellow-500"}>{o.status}</Badge></TableCell>
                      <TableCell>{formatRupiah(o.charge)}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada order</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
