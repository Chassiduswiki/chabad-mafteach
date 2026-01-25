"use client";

import React from "react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4">
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last Updated: January 25, 2026</p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing Chabad Mafteach, you agree to be bound by these terms. 
            The platform is dedicated to Torah study and research; we expect all 
            contributors to maintain high standards of accuracy and respect.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. Content Ownership</h2>
          <p>
            Content on this platform is for educational and research purposes. 
            Source texts remain the property of their respective publishers/copyright holders. 
            User contributions are licensed under Creative Commons unless otherwise specified.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. Community Guidelines</h2>
          <p>
            Vandalism, spam, or intentional misinformation will result in immediate 
            account suspension. We reserve the right to moderate all user contributions.
          </p>
        </section>

        <div className="mt-12 p-6 border rounded-lg bg-muted/30">
          <p className="text-sm italic">
            These terms are subject to change as the platform evolves.
          </p>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
