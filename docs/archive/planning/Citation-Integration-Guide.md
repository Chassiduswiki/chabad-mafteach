# Citation System Integration Guide

## Overview

This guide provides technical documentation for developers who want to extend, integrate with, or modify the enhanced citation system. The system now automatically associates citations with existing documents and provides Sefaria integration for external sources.

## Architecture Overview

### Core Components

```
CitationCommandPalette (UI Layer)
├── useDocumentSearch (Document search hook)
├── useSourceSearch (Source search hook)
├── useCreateSource (Enhanced source creation)
└── SefariaSearchModal (External source integration)
```

### Data Flow

```typescript
User Input → CitationCommandPalette → Combined Search → Selection → Source Creation
    ↓              ↓                        ↓            ↓            ↓
Document? → useDocumentSearch ──────────────┼────────────┼────────────┼───────→ Source with document_id
Source?   → useSourceSearch ────────────────┼────────────┼────────────┼───────→ Existing source reference
External? → SefariaSearchModal ─────────────┼────────────┼────────────┼───────→ External source creation
                                              ↓            ↓            ↓
                                           Combined     Selected     Created source
                                           Results      Item        with metadata
```

## Extending the Citation System

### Adding New Search Sources

#### 1. Create Custom Search Hook

```typescript
// lib/hooks/useCustomSearch.ts
import { useState } from 'react';
import Fuse from 'fuse.js';

interface CustomSearchResult {
  id: string;
  title: string;
  author?: string;
  type: 'custom';
  score: number;
}

export function useCustomSearch() {
  const [results, setResults] = useState<CustomSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCustom = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Your custom search logic here
      const data = await fetchCustomAPI(query);

      // Apply fuzzy search
      const fuse = new Fuse(data, {
        keys: ['title', 'author'],
        threshold: 0.3,
        includeScore: true
      });

      const fuzzyResults = fuse.search(query).map(result => ({
        ...result.item,
        score: 1 - (result.score || 0) // Convert to confidence score
      }));

      setResults(fuzzyResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { searchCustom, results, isLoading, error };
}
```

#### 2. Integrate into CitationCommandPalette

```typescript
// components/editor/CitationCommandPalette.tsx
import { useCustomSearch } from '@/lib/hooks/useCustomSearch';

export function CitationCommandPalette() {
  const customSearch = useCustomSearch();

  // Add to combined search logic
  const combinedResults = useMemo(() => {
    const allResults: SearchResult[] = [];

    // Existing document and source results...
    allResults.push(...documentResults.map(r => ({ ...r, type: 'document' as const })));
    allResults.push(...sourceResults.map(r => ({ ...r, type: 'source' as const })));

    // Add custom search results
    allResults.push(...customSearch.results.map(r => ({
      ...r,
      type: 'custom' as const,
      badge: '🟠' // Orange badge for custom sources
    })));

    return allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [documentResults, sourceResults, customSearch.results]);

  // Add search trigger
  useEffect(() => {
    if (searchQuery.length > 2) {
      searchDocuments(searchQuery);
      searchSources(searchQuery);
      customSearch.searchCustom(searchQuery); // Add custom search
    }
  }, [searchQuery]);

  // Handle custom selection
  const handleSelectCustom = (result: CustomResult) => {
    setSelectedCustom(result);
    setView('create');
  };

  return (
    // ... existing JSX ...
    {combinedResults.map((result) => (
      <CommandItem
        key={`${result.type}-${result.id}`}
        onSelect={() => {
          if (result.type === 'document') handleSelectDocument(result);
          else if (result.type === 'source') handleSelectSource(result);
          else if (result.type === 'custom') handleSelectCustom(result); // Add custom handler
          else if (result.type === 'sefaria') openSefariaModal();
        }}
      >
        <div className="flex items-center gap-2">
          <span>{result.badge}</span>
          <span>{result.title}</span>
        </div>
      </CommandItem>
    ))}
  );
}
```

### Adding New External Source Systems

#### 1. Extend External System Types

```typescript
// lib/types/index.ts
export type ExternalSystem = 'sefaria' | 'wikisource' | 'hebrewbooks' | 'custom_system';

export interface ExternalSourceData {
  system: ExternalSystem;
  id: string;
  url: string;
  title?: string;
  author?: string;
  metadata?: Record<string, any>;
}
```

#### 2. Create External Source Handler

```typescript
// lib/external-sources/customSystem.ts
export class CustomSystemHandler {
  static async search(query: string) {
    const response = await fetch(`https://api.custom-system.com/search?q=${query}`);
    const data = await response.json();

    return data.results.map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      url: item.url,
      preview: item.description,
      system: 'custom_system' as const
    }));
  }

  static async getDetails(id: string) {
    const response = await fetch(`https://api.custom-system.com/item/${id}`);
    const data = await response.json();

    return {
      system: 'custom_system' as const,
      id: data.id,
      url: data.url,
      title: data.title,
      author: data.author,
      metadata: {
        description: data.description,
        publicationDate: data.published,
        language: data.language
      }
    };
  }
}
```

#### 3. Integrate into SefariaSearchModal

```typescript
// components/editor/SefariaSearchModal.tsx
import { CustomSystemHandler } from '@/lib/external-sources/customSystem';

export function SefariaSearchModal({ onSelect }: Props) {
  const [searchSystem, setSearchSystem] = useState<'sefaria' | 'custom'>('sefaria');

  const handleSearch = async (query: string) => {
    if (searchSystem === 'sefaria') {
      // Existing Sefaria logic
      const results = await searchSefaria(query);
      setResults(results);
    } else {
      // Custom system logic
      const results = await CustomSystemHandler.search(query);
      setResults(results);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    let externalData;

    if (result.system === 'sefaria') {
      externalData = await getSefariaDetails(result.id);
    } else {
      externalData = await CustomSystemHandler.getDetails(result.id);
    }

    onSelect({
      title: result.title,
      author: result.author,
      externalSource: externalData
    });
  };

  return (
    <Dialog>
      {/* Existing modal structure */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={searchSystem === 'sefaria' ? 'default' : 'outline'}
          onClick={() => setSearchSystem('sefaria')}
        >
          Sefaria
        </Button>
        <Button
          variant={searchSystem === 'custom' ? 'default' : 'outline'}
          onClick={() => setSearchSystem('custom')}
        >
          Custom System
        </Button>
      </div>
      {/* Rest of modal */}
    </Dialog>
  );
}
```

### Customizing Search Priority

#### 1. Modify Search Weights

```typescript
// components/editor/CitationCommandPalette.tsx
const SEARCH_WEIGHTS = {
  document: 1.0,    // Highest priority
  source: 0.8,      // Medium priority
  custom: 0.6,      // Lower priority
  sefaria: 0.4      // Lowest priority (fallback)
};

const combinedResults = useMemo(() => {
  const allResults: SearchResult[] = [
    ...documentResults.map(r => ({ ...r, weight: SEARCH_WEIGHTS.document })),
    ...sourceResults.map(r => ({ ...r, weight: SEARCH_WEIGHTS.source })),
    ...customResults.map(r => ({ ...r, weight: SEARCH_WEIGHTS.custom })),
    ...sefariaResults.map(r => ({ ...r, weight: SEARCH_WEIGHTS.sefaria }))
  ];

  return allResults.sort((a, b) => {
    // Sort by weight first, then by score
    if (a.weight !== b.weight) {
      return b.weight - a.weight;
    }
    return (b.score || 0) - (a.score || 0);
  });
}, [documentResults, sourceResults, customResults, sefariaResults]);
```

#### 2. Dynamic Priority Based on Context

```typescript
// Adjust weights based on user context
const getDynamicWeights = (userContext: UserContext) => {
  const baseWeights = { ...SEARCH_WEIGHTS };

  // Prioritize documents for researchers
  if (userContext.role === 'researcher') {
    baseWeights.document = 1.2;
  }

  // Prioritize external sources for students
  if (userContext.role === 'student') {
    baseWeights.sefaria = 0.8;
    baseWeights.custom = 0.7;
  }

  return baseWeights;
};
```

## Performance Optimization

### Implementing Caching

#### 1. Document Search Caching

```typescript
// lib/hooks/useDocumentSearch.ts
const CACHE_DURATION = 60 * 1000; // 60 seconds

class DocumentSearchCache {
  private cache = new Map<string, { data: Document[]; timestamp: number }>();

  get(query: string): Document[] | null {
    const cached = this.cache.get(query);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(query);
      return null;
    }

    return cached.data;
  }

  set(query: string, data: Document[]) {
    this.cache.set(query, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const documentCache = new DocumentSearchCache();
```

#### 2. Debounced Search

```typescript
// lib/hooks/useDebouncedSearch.ts
import { useEffect, useState } from 'react';

export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchFn(query);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, searchFn, delay]);

  return { setQuery, results, isLoading };
}
```

### Result Limiting

```typescript
// Limit results to prevent UI lag
const MAX_RESULTS = 15;

const combinedResults = useMemo(() => {
  const allResults = [
    ...documentResults.slice(0, 5),  // Max 5 documents
    ...sourceResults.slice(0, 5),    // Max 5 sources
    ...customResults.slice(0, 3),    // Max 3 custom
    ...sefariaResults.slice(0, 2)    // Max 2 Sefaria
  ];

  return allResults
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MAX_RESULTS);
}, [documentResults, sourceResults, customResults, sefariaResults]);
```

## Error Handling & Validation

### Custom Error Types

```typescript
// lib/errors/CitationErrors.ts
export class CitationError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'CitationError';
  }
}

export class DocumentNotFoundError extends CitationError {
  constructor(documentId: number) {
    super(`Document with ID ${documentId} not found`, 'DOCUMENT_NOT_FOUND', { documentId });
  }
}

export class DuplicateSourceError extends CitationError {
  constructor(title: string) {
    super(`Source "${title}" already exists`, 'DUPLICATE_SOURCE', { title });
  }
}

export class ExternalSourceError extends CitationError {
  constructor(system: string, message: string) {
    super(`External source error (${system}): ${message}`, 'EXTERNAL_SOURCE_ERROR', { system });
  }
}
```

### Error Boundaries

```typescript
// components/editor/CitationErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CitationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Citation system error:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h3 className="text-red-800 font-medium">Citation System Error</h3>
          <p className="text-red-600 text-sm mt-1">
            Something went wrong with the citation system. Please try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Integration

### Unit Tests for Hooks

```typescript
// __tests__/hooks/useDocumentSearch.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDocumentSearch } from '@/lib/hooks/useDocumentSearch';

describe('useDocumentSearch', () => {
  it('searches documents successfully', async () => {
    const { result } = renderHook(() => useDocumentSearch());

    await act(async () => {
      await result.current.searchDocuments('Tanya');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].title).toContain('Tanya');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles errors gracefully', async () => {
    // Mock network failure
    const { result } = renderHook(() => useDocumentSearch());

    await act(async () => {
      await result.current.searchDocuments('invalid');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.results).toHaveLength(0);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/CitationWorkflow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CitationCommandPalette } from '@/components/editor/CitationCommandPalette';

describe('Citation Workflow Integration', () => {
  it('completes full citation creation workflow', async () => {
    render(<CitationCommandPalette onSelect={mockOnSelect} />);

    // Open citation palette
    fireEvent.click(screen.getByRole('button', { name: /add citation/i }));

    // Search for document
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Tanya' } });

    // Wait for results and select document
    await waitFor(() => {
      expect(screen.getByText('Tanya (Likkutei Amarim)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Tanya (Likkutei Amarim)'));

    // Verify citation creation
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          source: expect.objectContaining({
            title: 'Tanya (Likkutei Amarim)',
            document_id: expect.any(Number)
          })
        })
      );
    });
  });
});
```

## Migration & Backwards Compatibility

### Handling Legacy Citations

```typescript
// lib/utils/citation-migration.ts
export async function migrateLegacyCitations() {
  const legacySources = await directus.items('sources').readMany({
    filter: {
      document_id: { _null: true },
      is_external: { _null: true }
    }
  });

  for (const source of legacySources.data) {
    // Attempt fuzzy matching against documents
    const matchedDocument = await findDocumentMatch(source.title);

    if (matchedDocument && matchedDocument.score > 0.8) {
      await directus.items('sources').updateOne(source.id, {
        document_id: matchedDocument.id,
        is_external: false
      });
    } else {
      // Mark as potentially external
      await directus.items('sources').updateOne(source.id, {
        is_external: false // Explicitly mark as internal
      });
    }
  }
}
```

### Feature Flags

```typescript
// lib/config/features.ts
export const FEATURES = {
  DOCUMENT_ASSOCIATION: process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_ASSOCIATION === 'true',
  SEFARIA_INTEGRATION: process.env.NEXT_PUBLIC_ENABLE_SEFARIA_INTEGRATION === 'true',
  CUSTOM_SEARCH_SOURCES: process.env.NEXT_PUBLIC_ENABLE_CUSTOM_SEARCH === 'true'
};

// Usage in components
if (FEATURES.DOCUMENT_ASSOCIATION) {
  // Enable document search features
}
```

## API Reference

### Hook Interfaces

```typescript
interface UseDocumentSearchReturn {
  searchDocuments: (query: string) => Promise<void>;
  results: DocumentSearchResult[];
  isLoading: boolean;
  error: string | null;
}

interface UseCreateSourceReturn {
  createSource: (input: CreateSourceInput) => Promise<Source>;
  isLoading: boolean;
  error: string | null;
  matchedDocument?: Document;
}

interface CreateSourceInput {
  title: string;
  author?: string;
  documentId?: number;
  externalSource?: ExternalSourceData;
}
```

### Component Props

```typescript
interface CitationCommandPaletteProps {
  onSelect: (citation: CitationData) => void;
  initialQuery?: string;
  disabled?: boolean;
}

interface SefariaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (externalSource: ExternalSourceData) => void;
  initialQuery?: string;
}
```

## Best Practices

### Code Organization
1. **Separation of Concerns**: Keep search logic separate from UI components
2. **Error Boundaries**: Wrap citation components to prevent crashes
3. **Type Safety**: Use strict TypeScript interfaces for all data structures
4. **Performance**: Implement caching and debouncing for search operations

### User Experience
1. **Progressive Enhancement**: Core citation functionality works without enhancements
2. **Clear Feedback**: Show loading states, errors, and success messages
3. **Accessibility**: Support keyboard navigation and screen readers
4. **Responsive Design**: Works on all device sizes

### Maintenance
1. **Feature Flags**: Use feature flags for new functionality
2. **Comprehensive Tests**: Unit and integration tests for all components
3. **Documentation**: Keep this guide updated with changes
4. **Version Control**: Tag releases and document breaking changes

---

**Last Updated:** December 2025
**Related Documentation:**
- [Citation System User Guide](Citation-User-Guide.md)
- [Citation System Enhancement Summary](Citation-System-Implementation-Summary.md)
- [API Procedures](API-Procedure-Documentation.md)
