"use client";

import React, { useState } from "react";
import { FileText, BookOpen, Upload, CheckCircle, AlertCircle, User, FileQuestion, Settings, ChevronRight, Lightbulb } from 'lucide-react';

interface EntryImportModalProps {
  onDocumentCreated: (documentId: string) => void;
  trigger: React.ReactNode;
}

type ContentType = 'article' | 'bio' | 'topic_update' | 'reference' | 'metadata';

interface ContentTypeOption {
  id: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  example: string;
}

const contentTypeOptions: ContentTypeOption[] = [
  {
    id: 'article',
    title: 'Complete Article or Chapter',
    description: 'Full-length content that will be broken into paragraphs and statements',
    icon: <BookOpen className="h-6 w-6" />,
    example: 'A complete article, chapter, or detailed explanation'
  },
  {
    id: 'bio',
    title: 'Biography or Profile',
    description: 'Information about a person, rabbi, or historical figure',
    icon: <User className="h-6 w-6" />,
    example: 'Life story, background, or profile of a scholar'
  },
  {
    id: 'topic_update',
    title: 'Update Topic Description',
    description: 'Add or modify information about an existing topic or concept',
    icon: <Lightbulb className="h-6 w-6" />,
    example: 'Additional insights or clarifications about a concept'
  },
  {
    id: 'reference',
    title: 'Quote or Reference',
    description: 'A single important quote, citation, or reference point',
    icon: <FileQuestion className="h-6 w-6" />,
    example: 'A key teaching, quote, or reference to add to the system'
  },
  {
    id: 'metadata',
    title: 'Technical Update',
    description: 'Update system metadata or make technical corrections',
    icon: <Settings className="h-6 w-6" />,
    example: 'Correcting information or updating technical details'
  }
];

export function EntryImportModal({ onDocumentCreated, trigger }: EntryImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'success'>('select');
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const resetModal = () => {
    setIsOpen(false);
    setCurrentStep('select');
    setSelectedContentType(null);
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
  };

  const handleContentTypeSelect = (contentType: ContentType) => {
    setSelectedContentType(contentType);
    setCurrentStep('upload');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.md')) {
        setError('Please select a Markdown (.md) file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const generateFrontmatter = (contentType: ContentType, filename: string): string => {
    const baseName = filename.replace('.md', '').replace(/[-_]/g, ' ');

    switch (contentType) {
      case 'article':
        return `---
title: "${baseName}"
category: General
difficulty: Intermediate
status: Draft
tags: []
---

Your article content here...`;

      case 'bio':
        return `---
content_type: bio
name: "${baseName}"
---

Biography content here...`;

      case 'topic_update':
        return `---
content_type: topic_description
name: "${baseName} Update"
target_id: "topic-uuid-here"
---

Updated description content...`;

      case 'reference':
        return `---
content_type: reference
name: "${baseName}"
---

Reference or quote content...`;

      case 'metadata':
        return `---
content_type: metadata
target_entity: topic
target_id: "record-uuid-here"
mapping_rules:
  field_name: "new_value"
---

Metadata content...`;

      default:
        return '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedContentType) return;

    setIsUploading(true);
    setError(null);

    try {
      // Generate frontmatter based on content type
      const frontmatter = generateFrontmatter(selectedContentType, selectedFile.name);
      const fileContent = await selectedFile.text();

      // Combine frontmatter with existing content, or replace if no frontmatter exists
      let processedContent = fileContent;
      if (!fileContent.trim().startsWith('---')) {
        processedContent = frontmatter + '\n\n' + fileContent;
      }

      // Create a new file with the processed content
      const processedFile = new File([processedContent], selectedFile.name, {
        type: 'text/markdown'
      });

      const formData = new FormData();
      formData.append('file', processedFile);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Please sign in first');
      }

      const response = await fetch('/api/ingest/entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      setCurrentStep('success');
      onDocumentCreated(result.document_id || result.topic_id || result.statement_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-4xl rounded-lg bg-background border border-border shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {currentStep === 'select' && 'What would you like to add?'}
                    {currentStep === 'upload' && `Add ${selectedContentType ? contentTypeOptions.find(opt => opt.id === selectedContentType)?.title.toLowerCase() : 'content'}`}
                    {currentStep === 'success' && 'Content Added Successfully'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStep === 'select' && 'Choose the type of content you want to contribute'}
                    {currentStep === 'upload' && 'Upload your markdown file'}
                    {currentStep === 'success' && 'Your contribution has been added to the system'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 'select' ? 'bg-blue-500 text-white' : currentStep === 'upload' || currentStep === 'success' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Choose Type</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-gray-200 rounded">
                    <div className={`h-1 rounded transition-all duration-300 ${currentStep === 'select' ? 'w-1/3' : 'w-2/3'} bg-blue-500`}></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Upload File</span>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 'upload' || currentStep === 'success' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {currentStep === 'select' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-6">
                    Select what type of content you'd like to contribute. We'll guide you through the process.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentTypeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleContentTypeSelect(option.id)}
                        className="p-4 border border-border rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1 text-blue-500 group-hover:text-blue-600">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground group-hover:text-blue-900 mb-1">
                              {option.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {option.description}
                            </p>
                            <p className="text-xs text-muted-foreground italic">
                              Example: {option.example}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'upload' && selectedContentType && (
                <div className="space-y-6">
                  {/* Content Type Summary */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {contentTypeOptions.find(opt => opt.id === selectedContentType)?.icon}
                      <div>
                        <h3 className="font-medium text-blue-900">
                          {contentTypeOptions.find(opt => opt.id === selectedContentType)?.title}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {contentTypeOptions.find(opt => opt.id === selectedContentType)?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select your Markdown file
                    </label>
                    <input
                      type="file"
                      accept=".md"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-muted-foreground
                        file:mr-4 file:py-3 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        border border-border rounded-md p-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a .md file. We'll automatically prepare it for this content type.
                    </p>
                  </div>

                  {/* Selected File Preview */}
                  {selectedFile && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-background rounded border text-xs font-mono">
                        <div className="text-muted-foreground mb-2">Frontmatter will be added automatically:</div>
                        <pre className="whitespace-pre-wrap text-foreground">
                          {generateFrontmatter(selectedContentType, selectedFile.name)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentStep('select')}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Back to selection
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || isUploading}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Add Content
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'success' && uploadResult && (
                <div className="text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Content Added Successfully!</h3>
                  <p className="text-muted-foreground">
                    {uploadResult.message}
                  </p>

                  <div className="max-w-md mx-auto text-left bg-muted/50 rounded-lg p-4 text-sm">
                    {uploadResult.file_info && (
                      <div className="space-y-1">
                        <div><strong>Content Type:</strong> {uploadResult.file_info.content_type}</div>
                        {uploadResult.file_info.content_blocks_created && (
                          <div><strong>Sections Created:</strong> {uploadResult.file_info.content_blocks_created}</div>
                        )}
                        {uploadResult.file_info.statements_created && (
                          <div><strong>Statements:</strong> {uploadResult.file_info.statements_created}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={resetModal}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep('select');
                        setSelectedContentType(null);
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                      className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                    >
                      Add More Content
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
