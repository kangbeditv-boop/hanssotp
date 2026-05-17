"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!session) { redirect("/login"); }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">
            <Button variant="ghost" size="icon" className="lg:hidden mb-4" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
