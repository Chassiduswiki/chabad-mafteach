'use client';

import React, { useState } from 'react';
import { SmartEditor } from '@/components/editor/SmartEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, FileText, Database, Link, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditingWorkflowProps {
  documentId: string;
  onComplete?: () => void;
}

type WorkflowStep = 'select' | 'edit' | 'break' | 'topics' | 'sources' | 'review' | 'publish';

interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  documentData: any;
}

const WORKFLOW_STEPS: { id: WorkflowStep; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    title: 'Select Content',
    description: 'Choose which paragraph to edit',
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: 'edit',
    title: 'Edit Content',
    description: 'Modify paragraph text with rich editing',
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: 'break',
    title: 'Break into Statements',
    description: 'Split paragraph into logical statements',
    icon: <Database className="h-4 w-4" />
  },
  {
    id: 'topics',
    title: 'Link Topics',
    description: 'Connect statements to relevant topics',
    icon: <Link className="h-4 w-4" />
  },
  {
    id: 'sources',
    title: 'Add Citations',
    description: 'Reference source materials',
    icon: <Link className="h-4 w-4" />
  },
  {
    id: 'review',
    title: 'Review Changes',
    description: 'Verify all relationships are correct',
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'publish',
    title: 'Publish',
    description: 'Make content live with version control',
    icon: <CheckCircle className="h-4 w-4" />
  }
];

export const EditingWorkflow: React.FC<EditingWorkflowProps> = ({
  documentId,
  onComplete
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 'select',
    completedSteps: [],
    documentData: null
  });

  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === workflowState.currentStep);
  const progress = ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;

  const handleStepComplete = (step: WorkflowStep, data?: any) => {
    setWorkflowState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps.filter(s => s !== step), step],
      currentStep: getNextStep(step),
      documentData: data || prev.documentData
    }));
  };

  const getNextStep = (completedStep: WorkflowStep): WorkflowStep => {
    const stepOrder: WorkflowStep[] = ['select', 'edit', 'break', 'topics', 'sources', 'review', 'publish'];
    const currentIndex = stepOrder.indexOf(completedStep);
    return stepOrder[currentIndex + 1] || completedStep;
  };

  const handleSaveDocument = async (documentData: any) => {
    // Call the smart editor API
    const response = await fetch('/api/editor/smart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_document',
        documentId,
        data: documentData
      })
    });

    if (response.ok) {
      handleStepComplete('publish');
      onComplete?.();
    }
  };

  const handleBreakStatements = async (paragraphId: string) => {
    const response = await fetch('/api/editor/smart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_statements',
        paragraphId
      })
    });

    if (response.ok) {
      handleStepComplete('break');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Content Editing Workflow</CardTitle>
            <Badge variant="outline">
              Step {currentStepIndex + 1} of {WORKFLOW_STEPS.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  workflowState.completedSteps.includes(step.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : workflowState.currentStep === step.id
                    ? 'border-primary text-primary'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {workflowState.completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="font-medium text-foreground">
              {WORKFLOW_STEPS.find(s => s.id === workflowState.currentStep)?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {WORKFLOW_STEPS.find(s => s.id === workflowState.currentStep)?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {workflowState.currentStep === 'select' && (
        <Alert>
          <Circle className="h-4 w-4" />
          <AlertDescription>
            Use the Smart Editor below to select a paragraph and begin editing.
            The workflow will guide you through each step automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Smart Editor */}
      <SmartEditor
        documentId={documentId}
        onSave={handleSaveDocument}
        onAutoBreak={handleBreakStatements}
      />

      {/* Step-specific guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Step Guidance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflowState.currentStep === 'edit' && (
            <div>
              <h4 className="font-medium">Edit Content</h4>
              <p className="text-sm text-muted-foreground">
                Use the TipTap editor to modify paragraph content. Changes are automatically tracked for version control.
              </p>
              <Button
                onClick={() => handleStepComplete('edit')}
                className="mt-3"
              >
                Content Edited → Next Step
              </Button>
            </div>
          )}

          {workflowState.currentStep === 'break' && (
            <div>
              <h4 className="font-medium">Break into Statements</h4>
              <p className="text-sm text-muted-foreground">
                Click "Break into Statements" to use AI to automatically split the paragraph into logical statements.
                This creates the database relationships needed for topic mapping.
              </p>
            </div>
          )}

          {workflowState.currentStep === 'topics' && (
            <div>
              <h4 className="font-medium">Link Topics</h4>
              <p className="text-sm text-muted-foreground">
                Each statement can be linked to relevant topics. The system will suggest topics based on content,
                or you can manually select them. This creates entries in the statement_topics junction table.
              </p>
              <Button
                onClick={() => handleStepComplete('topics')}
                className="mt-3"
              >
                Topics Linked → Next Step
              </Button>
            </div>
          )}

          {workflowState.currentStep === 'sources' && (
            <div>
              <h4 className="font-medium">Add Citations</h4>
              <p className="text-sm text-muted-foreground">
                Reference source materials for each statement. This creates source_links in the database
                with relationship types like "quotes", "references", etc.
              </p>
              <Button
                onClick={() => handleStepComplete('sources')}
                className="mt-3"
              >
                Citations Added → Next Step
              </Button>
            </div>
          )}

          {workflowState.currentStep === 'review' && (
            <div>
              <h4 className="font-medium">Review Data Structure</h4>
              <p className="text-sm text-muted-foreground">
                Check the "Data Structure" tab to verify all relationships are correct:
                documents → paragraphs → statements → topics & sources
              </p>
              <Button
                onClick={() => handleStepComplete('review')}
                className="mt-3"
              >
                Structure Verified → Publish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
