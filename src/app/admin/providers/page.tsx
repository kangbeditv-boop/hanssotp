"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface Provider {
  id: string;
  name: string;
  type: string;
  apiUrl: string;
  isActive: boolean;
  balance: number;
  markupPercent: number;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "SMS", apiUrl: "", apiKey: "", markupPercent: 10 });

  useEffect(() => {
    fetch("/api/admin/providers").then(r => r.json()).then(d => setProviders(d.providers || [])).catch(() => {});
  }, []);

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/providers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: active }) });
      setProviders(prev => prev.map(p => p.id === id ? { ...p, isActive: active } : p));
    } catch {}
  };

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/admin/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.provider) { setProviders(prev => [...prev, data.provider]); setShowForm(false); }
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Provider</h1>
          <p className="text-muted-foreground">Kelola provider SMS dan SMM</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Tambah Provider</Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Tambah Provider Baru</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nama</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Tipe</Label><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="SMS / SMM" /></div>
              <div className="space-y-2"><Label>API URL</Label><Input value={form.apiUrl} onChange={e => setForm({ ...form, apiUrl: e.target.value })} /></div>
              <div className="space-y-2"><Label>API Key</Label><Input type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} /></div>
              <div className="space-y-2"><Label>Markup (%)</Label><Input type="number" value={form.markupPercent} onChange={e => setForm({ ...form, markupPercent: Number(e.target.value) })} /></div>
            </div>
            <div className="flex gap-2"><Button onClick={handleAdd}>Simpan</Button><Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button></div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Daftar Provider</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>API URL</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Markup</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.type}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-40 truncate">{p.apiUrl}</TableCell>
                  <TableCell>{formatRupiah(p.balance)}</TableCell>
                  <TableCell>{p.markupPercent}%</TableCell>
                  <TableCell><Switch checked={p.isActive} onCheckedChange={(v) => handleToggle(p.id, v)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {providers.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada provider</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
