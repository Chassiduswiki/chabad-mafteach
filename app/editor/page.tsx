"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Upload, FileText, Users, Settings, Edit3, Search } from 'lucide-react';
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
          {/* Write & Learn - Most Common Use Case */}
          <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">✨ Write & Learn</h3>
                <p className="text-sm text-muted-foreground">Create articles, explanations, and personal insights with AI assistance</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Rich editor • Hebrew OCR • Smart citations • AI processing
              </div>
              <a
                href="/editor/write"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit3 className="h-4 w-4" />
                Start Writing
              </a>
            </div>
          </div>

          {/* Quick Research */}
          <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Research Topics</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Explore and improve topic definitions, boundaries, and explanations.
            </p>
            <a
              href="/editor/topics"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              Browse Topics
            </a>
          </div>

          {/* Import Books */}
          <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Import Books</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Add seforim from Sefaria, upload PDFs, or import text files to the library.
            </p>
            <a
              href="/editor/import"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Import Content
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
