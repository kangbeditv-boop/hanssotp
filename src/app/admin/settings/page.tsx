"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Bell, Database, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    defaultMarkup: 15,
    minTopup: 50000,
    maxTopup: 10000000,
    otpTimeout: 300,
    pollingInterval: 5,
    siteName: "HanssOTP",
    siteDescription: "Platform Jasa OTP & Virtual Number",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi sistem platform</p>
      </div>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2" />Umum</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Keamanan</TabsTrigger>
          <TabsTrigger value="pricing"><Database className="h-4 w-4 mr-2" />Harga</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Notifikasi</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>Pengaturan Umum</CardTitle><CardDescription>Konfigurasi dasar platform</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Situs</Label><Input value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Deskripsi</Label><Input value={settings.siteDescription} onChange={e => setSettings({ ...settings, siteDescription: e.target.value })} /></div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div><p className="font-medium">Mode Maintenance</p><p className="text-sm text-muted-foreground">Nonaktifkan sementara layanan untuk pemeliharaan</p></div>
                <Switch checked={settings.maintenanceMode} onCheckedChange={v => setSettings({ ...settings, maintenanceMode: v })} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div><p className="font-medium">Registrasi Terbuka</p><p className="text-sm text-muted-foreground">Izinkan pendaftaran user baru</p></div>
                <Switch checked={settings.registrationEnabled} onCheckedChange={v => setSettings({ ...settings, registrationEnabled: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Pengaturan Keamanan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>OTP Timeout (detik)</Label><Input type="number" value={settings.otpTimeout} onChange={e => setSettings({ ...settings, otpTimeout: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Polling Interval (detik)</Label><Input type="number" value={settings.pollingInterval} onChange={e => setSettings({ ...settings, pollingInterval: Number(e.target.value) })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pricing">
          <Card>
            <CardHeader><CardTitle>Pengaturan Harga</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Default Markup (%)</Label><Input type="number" value={settings.defaultMarkup} onChange={e => setSettings({ ...settings, defaultMarkup: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Minimum Top Up (Rp)</Label><Input type="number" value={settings.minTopup} onChange={e => setSettings({ ...settings, minTopup: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Maksimum Top Up (Rp)</Label><Input type="number" value={settings.maxTopup} onChange={e => setSettings({ ...settings, maxTopup: Number(e.target.value) })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Pengaturan Notifikasi</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Pengaturan email dan webhook notifikasi akan segera tersedia.</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
