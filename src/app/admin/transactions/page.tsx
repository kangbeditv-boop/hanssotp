"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/transactions").then(r => r.json()).then(d => setTransactions(d.transactions || [])).catch(() => {});
  }, []);

  const filtered = transactions.filter(t =>
    t.userName.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csv = ["ID,User,Tipe,Jumlah,Deskripsi,Status,Tanggal", ...filtered.map(t =>
      `${t.id},${t.userName},${t.type},${t.amount},${t.description},${t.status},${t.createdAt}`
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
          <p className="text-muted-foreground">Semua transaksi di platform</p>
        </div>
        <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaksi</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari transaksi..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{t.userName}</TableCell>
                  <TableCell><Badge variant="secondary">{t.type}</Badge></TableCell>
                  <TableCell className={t.type === "CREDIT" ? "text-green-600" : "text-red-600"}>{t.type === "CREDIT" ? "+" : "-"}{formatRupiah(t.amount)}</TableCell>
                  <TableCell className="max-w-48 truncate">{t.description}</TableCell>
                  <TableCell><Badge className={t.status === "SUCCESS" ? "bg-green-500" : t.status === "PENDING" ? "bg-yellow-500" : "bg-red-500"}>{t.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("id-ID")}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada transaksi</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
