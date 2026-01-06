'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportExportProps {
    topicId?: number;
}

export function ImportExport({ topicId }: ImportExportProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [exportData, setExportData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const response = await fetch('/api/editor/import-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data,
                    type: 'full' // Default to full structure import
                })
            });

            const result = await response.json();
            setImportResult(result);

            if (result.success) {
                // Refresh the page to show imported data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportResult({
                success: false,
                error: 'Failed to parse JSON file'
            });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleExport = async (type: 'topics' | 'paragraphs' | 'statements' | 'full') => {
        setIsExporting(true);
        setExportData(null);

        try {
            const url = topicId 
                ? `/api/editor/import-export?type=${type}&topicId=${topicId}`
                : `/api/editor/import-export?type=${type}`;

            const response = await fetch(url);
            const data = await response.json();
            setExportData(data);

            // Download the JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `chabad-mafteach-export-${type}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Export error:', error);
            setExportData({
                error: 'Failed to export data'
            });
        } finally {
            setIsExporting(false);
        }
    };

    const getSampleData = () => {
        return {
            topics: [
                {
                    canonical_title: "Example Topic",
                    slug: "example-topic",
                    topic_type: "concept",
                    description: "Example description",
                    definition_positive: "What it is",
                    definition_negative: "What it's not"
                }
            ],
            paragraphs: [
                {
                    topic_original_id: 0, // Reference to topic index
                    text: "Example paragraph content",
                    order_key: 1,
                    metadata: {}
                }
            ],
            statements: [
                {
                    paragraph_original_id: 0, // Reference to paragraph index
                    text: "Example statement",
                    order_key: 1,
                    appended_text: null,
                    metadata: {}
                }
            ]
        };
    };

    const downloadSample = () => {
        const sampleData = getSampleData();
        const blob = new Blob([JSON.stringify(sampleData, null, 2)], { 
            type: 'application/json' 
        });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'chabad-mafteach-sample-import.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    };

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Import Data</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Upload JSON File
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            disabled={isImporting}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={downloadSample}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Download Sample
                        </button>
                    </div>

                    {isImporting && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border border-primary border-t-transparent"></div>
                            Importing data...
                        </div>
                    )}

                    {importResult && (
                        <div className={`p-4 rounded-lg border ${
                            importResult.success 
                                ? 'bg-green-50 text-green-800 border-green-200' 
                                : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {importResult.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className="font-medium">
                                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                                </span>
                            </div>
                            <p className="text-sm">
                                {importResult.success 
                                    ? importResult.message 
                                    : importResult.error || 'Unknown error occurred'
                                }
                            </p>
                            {importResult.results && (
                                <div className="mt-2 text-xs">
                                    Processed {importResult.results.length} items
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Export Data</h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                            onClick={() => handleExport('topics')}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Topics
                        </button>
                        <button
                            onClick={() => handleExport('paragraphs')}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Paragraphs
                        </button>
                        <button
                            onClick={() => handleExport('statements')}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Statements
                        </button>
                        <button
                            onClick={() => handleExport('full')}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Full Export
                        </button>
                    </div>

                    {isExporting && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border border-primary border-t-transparent"></div>
                            Exporting data...
                        </div>
                    )}

                    {exportData && (
                        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium">Export Complete</span>
                            </div>
                            <p className="text-sm mt-1">
                                Data exported successfully and downloaded
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Data Format</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Topics:</strong> canonical_title, slug, topic_type, description, definition_positive, definition_negative</p>
                    <p><strong>Paragraphs:</strong> topic_id, text, order_key, document_id (optional), metadata</p>
                    <p><strong>Statements:</strong> paragraph_id, text, order_key, appended_text (optional), metadata</p>
                    <p><strong>Full Structure:</strong> Use topic_original_id and paragraph_original_id for references</p>
                </div>
            </div>
        </div>
    );
}
