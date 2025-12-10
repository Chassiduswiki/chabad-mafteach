'use client';

import React from 'react';
import { TipTapEditor } from '@/components/editor/TipTapEditor';

export default function TipTapDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">TipTap Editor Demo</h1>
          <p className="text-muted-foreground">
            Experience the new TipTap-powered rich text editor with modern features and intuitive controls.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <TipTapEditor
            docId={null}
            className=""
            onBreakStatements={async () => {
              console.log('Break statements functionality would go here');
            }}
          />
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-foreground mb-2">Formatting</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Bold, italic, code text</li>
                <li>• Headings (H1, H2, H3)</li>
                <li>• Bullet and numbered lists</li>
                <li>• Blockquotes and code blocks</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Advanced</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Character counting</li>
                <li>• Undo/redo support</li>
                <li>• Citation integration</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
