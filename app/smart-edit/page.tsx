'use client';

import React from 'react';
import { EditingWorkflow } from '@/components/editor/EditingWorkflow';

interface SmartEditDemoProps {
  documentId?: string;
}

export default function SmartEditDemo({ documentId = 'demo-doc-id' }: SmartEditDemoProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Smart Content Editing System
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Edit texts while maintaining proper database relationships
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Structured Editing</h3>
              <p className="text-sm text-muted-foreground">
                Edit at the paragraph level while maintaining statement-paragraph relationships.
                Changes are automatically versioned and tracked.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">AI-Powered Breaking</h3>
              <p className="text-sm text-muted-foreground">
                Use AI to automatically split paragraphs into logical statements.
                Creates proper database entries with foreign key relationships.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Relationship Management</h3>
              <p className="text-sm text-muted-foreground">
                Maintain topic mappings and source citations.
                Updates statement_topics and source_links junction tables automatically.
              </p>
            </div>
          </div>

          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Database Relationship Flow</h2>
            <div className="font-mono text-sm bg-background p-4 rounded border">
              <div>documents → paragraphs → statements</div>
              <div>statements ↔ topics (via statement_topics)</div>
              <div>statements → sources (via source_links)</div>
              <div>↳ All with version control and audit trails</div>
            </div>
          </div>
        </div>

        <EditingWorkflow
          documentId={documentId}
          onComplete={() => {
            console.log('Editing workflow completed!');
            // Could redirect or show success message
          }}
        />
      </div>
    </div>
  );
}
