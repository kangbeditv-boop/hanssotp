"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface ResellerRequest {
  id: string;
  userName: string;
  email: string;
  currentTier: string;
  requestedTier: string;
  balance: number;
  status: string;
  createdAt: string;
}

export default function AdminResellersPage() {
  const [requests, setRequests] = useState<ResellerRequest[]>([]);

  useEffect(() => {
    fetch("/api/admin/resellers").then(r => r.json()).then(d => setRequests(d.requests || [])).catch(() => {});
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await fetch(`/api/admin/resellers/${id}/${action}`, { method: "POST" });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r));
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Reseller</h1>
        <p className="text-muted-foreground">Approve/reject permintaan VIP reseller</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Permintaan VIP Reseller</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tier Saat Ini</TableHead>
                <TableHead>Tier Diminta</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.userName}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell><Badge variant="secondary">{r.currentTier}</Badge></TableCell>
                  <TableCell><Badge>{r.requestedTier}</Badge></TableCell>
                  <TableCell>{formatRupiah(r.balance)}</TableCell>
                  <TableCell>
                    <Badge className={r.status === "APPROVED" ? "bg-green-500" : r.status === "REJECTED" ? "bg-red-500" : "bg-yellow-500"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === "PENDING" && (
                      <div className="flex gap-1">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleAction(r.id, "approve")}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, "reject")}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada permintaan</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
