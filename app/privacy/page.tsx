"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4">
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last Updated: January 25, 2026</p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, 
            save topics to your collections, or contribute content to the platform. 
            This may include your name, email address, and user-generated content.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to maintain and improve our services, 
            personalize your learning experience, and communicate with you about 
            updates or community features.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">3. Data Storage</h2>
          <p>
            Your data is stored securely using industry-standard encryption. 
            We do not sell your personal information to third parties.
          </p>
        </section>

        <div className="mt-12 p-6 border rounded-lg bg-muted/30">
          <p className="text-sm italic">
            This is a preliminary policy for Chabad Mafteach. As the platform grows, 
            we will update these terms to ensure full compliance with global standards.
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
