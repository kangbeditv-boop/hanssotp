"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Moon, Sun, User, LogOut, LayoutDashboard, Key, Shield } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">HanssOTP</span>
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/#fitur" className="text-sm font-medium hover:text-primary transition-colors">Fitur</Link>
          <Link href="/#cara-kerja" className="text-sm font-medium hover:text-primary transition-colors">Cara Kerja</Link>
          <Link href="/#harga" className="text-sm font-medium hover:text-primary transition-colors">Harga</Link>
          <Link href="/api-docs" className="text-sm font-medium hover:text-primary transition-colors">API Docs</Link>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={toggleDark}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profil</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/api-keys"><Key className="mr-2 h-4 w-4" />API Keys</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild><Link href="/login">Masuk</Link></Button>
              <Button asChild><Link href="/register">Daftar</Link></Button>
            </div>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          <Link href="/#fitur" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Fitur</Link>
          <Link href="/#cara-kerja" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Cara Kerja</Link>
          <Link href="/#harga" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>Harga</Link>
          <Link href="/api-docs" className="block text-sm font-medium hover:text-primary" onClick={() => setMobileOpen(false)}>API Docs</Link>
        </div>
      )}
    </nav>
  );
}
