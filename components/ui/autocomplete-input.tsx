"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { sefariaClient, AutocompleteSuggestion, SefariaBook } from '@/lib/sefaria-client';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (book: SefariaBook) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  onSearch,
  placeholder = "Search Sefaria...",
  className
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await sefariaClient.getAutocompleteSuggestions(value, 8);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && onSearch) {
        e.preventDefault();
        onSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]?.book) {
          handleSelect(suggestions[selectedIndex]);
        } else if (onSearch) {
          onSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.book) {
      onSelect(suggestion.book);
      onChange(suggestion.text);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            className={cn("pr-10", className)}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <Button
          onClick={onSearch}
          disabled={!value.trim() || isLoading}
          size="default"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.text}-${index}`}
              className={cn(
                "flex items-center justify-between px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50",
                selectedIndex === index && "bg-blue-50"
              )}
              onClick={() => handleSelect(suggestion)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </div>
                  {suggestion.hebrew && suggestion.hebrew !== suggestion.text && (
                    <div className="text-sm text-gray-500 font-hebrew">
                      {suggestion.hebrew}
                    </div>
                  )}
                </div>
                {suggestion.category && (
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.category}
                  </div>
                )}
              </div>
              <BookOpen className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && value.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
          No matching books found. Try different spelling or check Sefaria directly.
        </div>
      )}
    </div>
  );
}
