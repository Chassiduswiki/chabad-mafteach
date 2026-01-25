'use client';

import React, { useState, useCallback } from 'react';
import { Search, X, Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AISearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string, filters?: any) => void;
}

export function AISearchBar({ 
  placeholder = "Search topics, sources, or concepts...",
  className = "",
  onSearch 
}: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    if (!query || query.length < 2) return;
    if (onSearch) {
      onSearch(query);
    }
  }, [query, onSearch]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-11 bg-background/50 backdrop-blur-sm border-primary/10 focus-visible:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {isLoading && (
            <Loader2 className="h-4 w-4 text-primary animate-spin mr-1" />
          )}
        </div>
      </div>
      
      {/* AI Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <Card className="absolute z-50 top-full mt-2 left-0 right-0 overflow-hidden shadow-2xl border-primary/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 bg-primary/5 border-b flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">AI Suggestions</span>
          </div>
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between group"
              >
                <span>{suggestion}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-destructive/5 border border-destructive/20 text-destructive rounded-lg p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
