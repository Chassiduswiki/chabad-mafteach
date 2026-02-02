'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { CompactUserMenu } from '@/components/auth/CompactUserMenu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header with User Menu */}
      <header className="sticky top-0 z-40 border-b border-red-500/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/editor"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20 rounded-full">
                    Admin Mode
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">System Management</p>
              </div>
            </div>
          </div>
          <CompactUserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
