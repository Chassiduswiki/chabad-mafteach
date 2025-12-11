"use client";

import React, { useState } from "react";
import { FileText, BookOpen, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface EntryImportModalProps {
  onDocumentCreated: (documentId: string) => void;
  trigger: React.ReactNode;
}

export function EntryImportModal({ onDocumentCreated, trigger }: EntryImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.md')) {
        setError('Please select a .md file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
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
      onDocumentCreated(result.document_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    setIsOpen(false);
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
            className="w-full max-w-2xl rounded-lg bg-background border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Import Entry Document</h2>
                  <p className="text-sm text-muted-foreground">Upload a markdown file with frontmatter</p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* File Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Markdown File
                  </label>
                  <input
                    type="file"
                    accept=".md"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    File must contain YAML frontmatter with slug, name, category, difficulty, and status fields.
                  </p>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
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
                <div className="flex justify-end">
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Entry
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-medium text-green-700">Import Successful!</p>
                  </div>

                  <div className="space-y-2 text-sm text-green-700">
                    <p><strong>Title:</strong> {uploadResult.file_info.title}</p>
                    <p><strong>Paragraphs:</strong> {uploadResult.file_info.paragraphs_created}</p>
                    <p><strong>Statements:</strong> {uploadResult.file_info.statements_created}</p>
                    <p><strong>Category:</strong> {uploadResult.file_info.category}</p>
                    <p><strong>Difficulty:</strong> {uploadResult.file_info.difficulty}</p>
                    {uploadResult.file_info.tags && uploadResult.file_info.tags.length > 0 && (
                      <p><strong>Tags:</strong> {uploadResult.file_info.tags.join(', ')}</p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={resetModal}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Format Requirements */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Required Frontmatter Format:</h4>
                <pre className="text-xs text-blue-800 bg-blue-100 p-2 rounded overflow-x-auto">
{`---
slug: entry-slug
name: Entry Name
category: Category Name
difficulty: Beginner|Intermediate|Advanced
status: Draft|Published
name_hebrew: Hebrew Name (optional)
tags: [tag1, tag2] (optional)
---`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
