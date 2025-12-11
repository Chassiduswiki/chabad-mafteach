"use client";

import React, { useState, useEffect } from "react";
import { useSefariaText } from "@/lib/hooks/useSefariaText";
import {
  Loader2,
  Search,
  ExternalLink,
  BookOpen,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface SefariaSearchModalProps {
  open: boolean;
  searchQuery: string;
  onClose: () => void;
  onSelectSource: (source: {
    title: string;
    external_id: string;
    external_url: string;
    citation_text: string;
  }) => void;
}

interface SefariaSearchResult {
  ref: string;
  heRef: string;
  title: string;
  book: string;
  sections: number[];
}

export function SefariaSearchModal({
  open,
  searchQuery,
  onClose,
  onSelectSource,
}: SefariaSearchModalProps) {
  const [sefariaQuery, setSefariaQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<SefariaSearchResult | null>(null);
  const { data: textData, loading: textLoading, error: textError } = useSefariaText(
    selectedResult?.ref || null
  );

  // Set initial search query when modal opens
  useEffect(() => {
    if (open && searchQuery) {
      setSefariaQuery(searchQuery);
    }
  }, [open, searchQuery]);

  // Mock Sefaria search results (in real implementation, this would call Sefaria API)
  const mockSearchResults: SefariaSearchResult[] = [
    {
      ref: "Genesis 1:1",
      heRef: "בראשית א:א",
      title: "Genesis 1:1",
      book: "Genesis",
      sections: [1, 1],
    },
    {
      ref: "Exodus 20:1-17",
      heRef: "שמות כ:א-יז",
      title: "Ten Commandments",
      book: "Exodus",
      sections: [20, 1],
    },
    {
      ref: "Leviticus 19:18",
      heRef: "ויקרא יט:יח",
      title: "Love Your Neighbor",
      book: "Leviticus",
      sections: [19, 18],
    },
  ];

  const searchResults = sefariaQuery.length >= 2
    ? mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(sefariaQuery.toLowerCase()) ||
        result.book.toLowerCase().includes(sefariaQuery.toLowerCase())
      )
    : [];

  const handleSelectResult = (result: SefariaSearchResult) => {
    setSelectedResult(result);
  };

  const handleImportSource = () => {
    if (!selectedResult) return;

    onSelectSource({
      title: selectedResult.title,
      external_id: selectedResult.ref,
      external_url: `https://www.sefaria.org/${selectedResult.ref.replace(/\s+/g, '_')}`,
      citation_text: selectedResult.heRef,
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">External Source</p>
            <p className="text-lg font-semibold text-gray-800">Search Sefaria</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search Jewish Texts</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={sefariaQuery}
                  onChange={(e) => setSefariaQuery(e.target.value)}
                  placeholder="Search for books, chapters, or verses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => window.open('https://www.sefaria.org', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Sefaria
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Results */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedResult?.ref === result.ref
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.book} • {result.ref}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {result.heRef}
                        </p>
                      </div>
                      {selectedResult?.ref === result.ref && (
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
                {sefariaQuery && searchResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try different keywords or check Sefaria directly</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
                {selectedResult ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800">{selectedResult.title}</h4>
                      <p className="text-sm text-gray-500">{selectedResult.ref}</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedResult.heRef}</p>
                    </div>

                    {textLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading text...
                      </div>
                    ) : textError ? (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {textError}
                      </div>
                    ) : textData ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">{textData.text[0]}</p>
                        <p className="text-sm text-gray-600 font-hebrew">{textData.he[0]}</p>
                      </div>
                    ) : null}

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleImportSource}
                        disabled={!selectedResult}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Import as Source
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mb-2 text-gray-300" />
                    <p className="text-sm">Select a result to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
