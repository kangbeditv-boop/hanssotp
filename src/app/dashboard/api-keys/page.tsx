"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Trash2, Plus, Loader2, Eye, EyeOff } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/api-keys").then(r => r.json()).then(d => setKeys(d.keys || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!newKeyName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.key) {
        setNewKey(data.key.key);
        setKeys(prev => [data.key, ...prev]);
        setNewKeyName("");
      }
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">Kelola API key untuk integrasi developer</p>
      </div>
      {newKey && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">API Key baru berhasil dibuat! Salin sekarang, key tidak akan ditampilkan lagi.</p>
            <div className="flex gap-2">
              <Input value={newKey} readOnly className="font-mono" />
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); }}><Copy className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Buat API Key Baru</CardTitle>
          <CardDescription>API key digunakan untuk mengakses REST API publik</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 max-w-lg">
            <div className="flex-1 space-y-2">
              <Label>Nama Key</Label>
              <Input placeholder="Contoh: Production API" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={loading || !newKeyName}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Buat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Daftar API Key</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Terakhir Digunakan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map(k => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{showKey === k.id ? k.key : `${k.key.slice(0, 8)}...`}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKey(showKey === k.id ? null : k.id)}>
                        {showKey === k.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(k.key)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{k.lastUsed || "Belum pernah"}</TableCell>
                  <TableCell><Badge className={k.isActive ? "bg-green-500" : "bg-red-500"}>{k.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(k.id)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {keys.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada API key</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Dokumentasi API</CardTitle><CardDescription>Panduan penggunaan REST API</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-mono mb-2">Base URL: <span className="text-primary">https://yourdomain.com/api/v1</span></p>
            <p className="text-sm font-mono">Authorization: <span className="text-primary">Bearer YOUR_API_KEY</span></p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Endpoint yang tersedia:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>GET /balance - Cek saldo</li>
              <li>GET /countries - Daftar negara</li>
              <li>GET /services?country=id - Daftar layanan</li>
              <li>POST /order/number - Beli nomor</li>
              <li>GET /order/:id/sms - Cek OTP</li>
              <li>DELETE /order/:id - Cancel order</li>
              <li>GET /orders - Riwayat order</li>
              <li>POST /topup - Buat invoice</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
