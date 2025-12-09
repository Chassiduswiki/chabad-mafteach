"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Search, BookOpen, FileText } from 'lucide-react';
import { sefariaClient, SefariaBook } from '@/lib/sefaria-client';

interface IngestionModalProps {
  onDocumentCreated?: (documentId: string) => void;
  trigger?: React.ReactNode;
}

export function IngestionModal({ onDocumentCreated, trigger }: IngestionModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sefaria' | 'text' | 'pdf'>('sefaria');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SefariaBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<SefariaBook | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSefariaSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await sefariaClient.searchBooks(searchQuery);
      setSearchResults(results);
      // If no exact match was selected via autocomplete, auto-select first result if it's an exact match
      if (!selectedBook && results.length > 0) {
        const exactMatch = results.find(book =>
          book.title.toLowerCase() === searchQuery.toLowerCase() ||
          book.heTitle === searchQuery
        );
        if (exactMatch) {
          setSelectedBook(exactMatch);
        }
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to search Sefaria' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromSefaria = async (): Promise<void> => {
    if (!selectedBook) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ingest/sefaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: selectedBook.title,
          language: 'he'
        })
      });

      const result = await response.json();

      if (result.success) {
        setFeedback({ 
          type: 'success', 
          message: `Successfully imported ${result.book_info.title} with ${result.book_info.paragraphs_created} paragraphs` 
        });
        onDocumentCreated?.(result.document_id);
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setFeedback({ type: 'error', message: result.error || 'Import failed' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to import from Sefaria' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextFileUpload = async (): Promise<void> => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (documentTitle) {
      formData.append('title', documentTitle);
    }
    formData.append('language', 'he');

    setIsLoading(true);
    try {
      const response = await fetch('/api/ingest/text', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setFeedback({ 
          type: 'success', 
          message: `Successfully uploaded ${result.file_info.filename} with ${result.file_info.paragraphs_created} paragraphs` 
        });
        onDocumentCreated?.(result.document_id);
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setFeedback({ type: 'error', message: result.error || 'Upload failed' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to upload text file' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfFileUpload = async (): Promise<void> => {
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage('Uploading PDF file...');

    try {
      setLoadingMessage('Analyzing PDF structure and text quality...');

      const formData = new FormData();
      formData.append('file', file);
      if (documentTitle) {
        formData.append('title', documentTitle);
      }
      formData.append('language', 'he');

      const response = await fetch('/api/ingest/pdf', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const ocrInfo = result.pdf_info.needs_ocr
          ? result.pdf_info.ocr_performed
            ? `🔍 OCR Analysis: ${result.pdf_info.text_quality} quality (${result.pdf_info.ocr_confidence?.toFixed(1)}% confidence)\n✅ OCR Enhancement Applied - Processing time: ${(result.pdf_info.ocr_processing_time || 0) / 1000}s`
            : `🔍 OCR Analysis: ${result.pdf_info.text_quality} quality (${result.pdf_info.ocr_confidence?.toFixed(1)}% confidence)\n⚠️ OCR Recommended but failed - used native text`
          : `🔍 OCR Analysis: ${result.pdf_info.text_quality} quality (${result.pdf_info.ocr_confidence?.toFixed(1)}% confidence)\n✅ Native text layer sufficient`;

        setFeedback({
          type: 'success',
          message: `✅ Successfully processed PDF "${result.pdf_info.filename}"\n📄 ${result.pdf_info.pages} pages → ${result.pdf_info.paragraphs_created} paragraphs\n📝 ${result.pdf_info.total_characters.toLocaleString()} characters extracted\n\n${ocrInfo}`
        });
        onDocumentCreated?.(result.document_id);

        // Auto-close after success
        setTimeout(() => setIsOpen(false), 8000); // Longer delay for OCR info
      } else {
        setFeedback({
          type: 'error',
          message: `❌ PDF Processing Failed\n${result.error || 'Unknown error occurred'}`
        });
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      setFeedback({
        type: 'error',
        message: `❌ Upload Error\nNetwork error or server unavailable. Please try again.`
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedBook(null);
    setFile(null);
    setDocumentTitle('');
    setFeedback(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Content
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Import Content
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setActiveTab('sefaria')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'sefaria' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Sefaria Import
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'text' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Text File Upload
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pdf' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            PDF Upload
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-3 rounded-md ${
            feedback.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Sefaria Import Tab */}
        {activeTab === 'sefaria' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sefaria-search">Search Sefaria</Label>
              <AutocompleteInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={(book) => {
                  setSelectedBook(book);
                  setSearchQuery(book.title);
                }}
                onSearch={handleSefariaSearch}
                placeholder="Start typing a book title (e.g., Tanya, Mishneh Torah)..."
              />
              <p className="text-xs text-gray-500">
                Try common variations: "likutei amarim", "shulchan aruch", "pirkei avot"
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Select a book to import:</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((book) => (
                    <div
                      key={book.title}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedBook?.title === book.title
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedBook(book)}
                    >
                      <div className="font-medium">{book.heTitle}</div>
                      <div className="text-sm text-gray-600">{book.title}</div>
                      <div className="text-xs text-gray-500">
                        {book.categories.join(', ')} • {book.length} sections
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Button */}
            {selectedBook && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleImportFromSefaria}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  {isLoading ? 'Importing...' : `Import ${selectedBook.heTitle}`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Text File Upload Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select Text File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".txt"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-title">Document Title (optional)</Label>
              <Input
                id="document-title"
                placeholder="Will use filename if not provided"
                value={documentTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentTitle(e.target.value)}
              />
            </div>

            {file && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            )}

            {/* Upload Button */}
            {file && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleTextFileUpload}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isLoading ? 'Uploading...' : 'Upload Text File'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* PDF Upload Tab */}
        {activeTab === 'pdf' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Select PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Maximum file size: 50MB. Text-based PDFs will extract text directly. Scanned PDFs will need OCR (coming in Phase 2).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf-document-title">Document Title (optional)</Label>
              <Input
                id="pdf-document-title"
                placeholder="Will use filename if not provided"
                value={documentTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {file && (
              <div className="p-3 bg-red-50 rounded-md border border-red-200">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-600">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                {loadingMessage && (
                  <div className="text-xs text-blue-600 mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-2"></div>
                    {loadingMessage}
                  </div>
                )}
                {!isLoading && (
                  <div className="text-xs text-red-600 mt-1">
                    ⚠️ Processing may take several seconds for large PDFs
                  </div>
                )}
              </div>
            )}

            {/* Upload Button */}
            {file && (
              <div className="flex justify-end">
                <Button
                  onClick={handlePdfFileUpload}
                  disabled={isLoading}
                  className={`gap-2 ${isLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                  {isLoading ? 'Processing...' : 'Process PDF'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
