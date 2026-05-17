"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Shield, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [profile, setProfile] = useState({ name: session?.user?.name || "", email: session?.user?.email || "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/v1/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    } catch {}
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return;
    setLoading(true);
    try {
      await fetch("/api/v1/profile/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }) });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profil & Keamanan</h1>
        <p className="text-muted-foreground">Kelola informasi akun dan keamanan Anda</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profil</TabsTrigger>
          <TabsTrigger value="security"><Lock className="h-4 w-4 mr-2" />Keamanan</TabsTrigger>
          <TabsTrigger value="2fa"><Shield className="h-4 w-4 mr-2" />2FA</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Informasi Profil</CardTitle><CardDescription>Update nama dan email Anda</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div className="space-y-2"><Label>Nama</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                <Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Simpan</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Ganti Password</CardTitle><CardDescription>Pastikan password baru minimal 8 karakter</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2"><Label>Password Saat Ini</Label><Input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Password Baru</Label><Input type="password" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} required minLength={8} /></div>
                <div className="space-y-2"><Label>Konfirmasi Password</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required /></div>
                <Button type="submit" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Ganti Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="2fa">
          <Card>
            <CardHeader><CardTitle>Two-Factor Authentication (2FA)</CardTitle><CardDescription>Tambahkan lapisan keamanan ekstra dengan Google Authenticator</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">2FA TOTP</p><p className="text-sm text-muted-foreground">Gunakan Google Authenticator</p></div>
                <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} />
              </div>
              {twoFaEnabled && (
                <div className="p-4 border rounded-lg space-y-4">
                  <p className="text-sm">Scan QR code berikut dengan Google Authenticator:</p>
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center"><p className="text-xs text-muted-foreground">QR Code</p></div>
                  <div className="space-y-2"><Label>Kode Verifikasi</Label><Input placeholder="Masukkan 6 digit kode" maxLength={6} /></div>
                  <Button>Aktifkan 2FA</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
