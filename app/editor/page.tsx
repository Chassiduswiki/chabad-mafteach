"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Upload, FileText, Users, Settings, Edit3 } from 'lucide-react';
import { IngestionModal } from "@/components/editor/IngestionModal";

export default function EditorPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    // Verify token (simple check - in production you'd verify with the server)
    try {
      // For demo purposes, we'll just check if token exists
      // In production, you'd decode and verify the JWT
      setUser({ role: 'editor', name: 'Editor User' }); // Mock user data
    } catch (error) {
      localStorage.removeItem('auth_token');
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Content Editor</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Write Content - Most Important */}
          <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">✨ Write Content</h3>
                <p className="text-sm text-muted-foreground">Create new articles and entries with Hebrew OCR and advanced citations</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Rich text editor • Hebrew OCR • Citation management • AI assistance
              </div>
              <a
                href="/editor/write"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit3 className="h-4 w-4" />
                Start Writing
              </a>
            </div>
          </div>

          {/* Topics Management */}
          <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Edit3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Edit Topics</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage topic definitions, boundaries, and descriptions without using Directus.
            </p>
            <a
              href="/editor/topics"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Manage Topics
            </a>
          </div>

          {/* Import Content */}
          <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Import Content</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Import new texts from Sefaria, upload PDFs, or add text files to the system.
            </p>
            <a
              href="/editor/import"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Start Importing
            </a>
          </div>

        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
          <div className="rounded-2xl border bg-card p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Import job completed</p>
                  <p className="text-xs text-muted-foreground">Tanya Likkutei Amarim - 45 paragraphs processed</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Document updated</p>
                  <p className="text-xs text-muted-foreground">Metadata updated for "Shulchan Aruch"</p>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
