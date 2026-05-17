"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Ban, Edit, UserCheck } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const handleBan = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === "BANNED" ? "ACTIVE" : "BANNED" } : u));
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manajemen User</h1>
        <p className="text-muted-foreground">Kelola semua pengguna platform</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar User</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari user..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell>{formatRupiah(u.balance)}</TableCell>
                  <TableCell><Badge className={u.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}>{u.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleBan(u.id)}>
                        {u.status === "BANNED" ? <UserCheck className="h-3 w-3 text-green-500" /> : <Ban className="h-3 w-3 text-red-500" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada user ditemukan</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
