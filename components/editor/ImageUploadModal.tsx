'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, FileImage } from 'lucide-react';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (imageUrl: string, altText: string) => void;
}

export function ImageUploadModal({ open, onClose, onInsert }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setAltText('');
    setImageUrl('');
    setIsUploading(false);
    setUploadMode('file');
    setDragActive(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Auto-fill alt text from filename
    if (!altText) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setAltText(nameWithoutExt);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleInsert = async () => {
    if (uploadMode === 'url') {
      if (!imageUrl.trim()) return;
      onInsert(imageUrl.trim(), altText.trim() || 'Image');
      handleClose();
      return;
    }

    if (!selectedFile || !preview) return;

    setIsUploading(true);

    try {
      // For now, use the data URL directly (base64)
      // In production, you would upload to a server/CDN
      onInsert(preview, altText.trim() || selectedFile.name);
      handleClose();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-background shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Insert Image</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setUploadMode('file')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                uploadMode === 'file'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setUploadMode('url')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                uploadMode === 'url'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              From URL
            </button>
          </div>

          {uploadMode === 'file' ? (
            <>
              {/* Drop Zone */}
              {!preview ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop an image here, or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary hover:underline"
                  >
                    browse to select
                  </button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Supports JPG, PNG, GIF, WebP
                  </p>
                </div>
              ) : (
                /* Preview */
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-contain bg-muted/30"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background text-foreground shadow-sm"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileImage className="h-4 w-4" />
                    <span className="truncate">{selectedFile?.name}</span>
                    <span className="text-xs">
                      ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* URL Input */
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              {imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-contain bg-muted/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Alt Text (for accessibility)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Helps screen readers describe the image to users
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={
              isUploading ||
              (uploadMode === 'file' ? !preview : !imageUrl.trim())
            }
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Insert Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
