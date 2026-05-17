import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">HanssOTP</span>
            </div>
            <p className="text-sm text-muted-foreground">Platform terpercaya untuk layanan OTP & virtual number di Indonesia.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Layanan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground">Beli Nomor OTP</Link></li>
              <li><Link href="/dashboard/smm" className="hover:text-foreground">SMM Panel</Link></li>
              <li><Link href="/reseller" className="hover:text-foreground">Program Reseller</Link></li>
              <li><Link href="/api-docs" className="hover:text-foreground">API Developer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Bantuan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#cara-kerja" className="hover:text-foreground">Cara Penggunaan</Link></li>
              <li><Link href="/#faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link href="/api-docs" className="hover:text-foreground">Dokumentasi API</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HanssOTP. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
