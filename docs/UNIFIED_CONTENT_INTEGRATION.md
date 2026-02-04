# HebrewBooks + Chabad.org/Lahak Integration Example

## 🎯 **Unified Content Source Pattern**

Here's how to integrate HebrewBooks with your existing Chabad.org/Lahak system without breaking anything.

---

## 📚 **Unified Content Interface**

```typescript
// lib/unified-content.ts
export interface ContentSource {
  type: 'chabad' | 'hebrewbooks' | 'local';
  id: string;
  title: string;
  author?: string;
  metadata?: any;
  urls?: {
    book?: string;
    viewer?: string;
    download?: string;
    cover?: string;
  };
}

// Your existing Chabad sources (unchanged)
const chabadSources: ContentSource[] = [
  {
    type: 'chabad',
    id: 'tanya-iggeret-hakodesh',
    title: 'Iggeret HaKodesh - Tanya',
    author: 'Rabbi Shneur Zalman of Liadi',
    // Your existing Chabad URL structure
  }
];

// Add HebrewBooks sources (new)
const hebrewbooksSources: ContentSource[] = [
  HebrewBooksAPI.createUnifiedSource(15419, 'Derech Mitzvosecha Vol 1', {
    author: 'Rabbi Menachem Mendel Schneersohn',
    category: 'Chabad Philosophy'
  }),
  HebrewBooksAPI.createUnifiedSource(28000, 'Tanya Vol 1', {
    author: 'Rabbi Shneur Zalman of Liadi',
    category: 'Chabad Philosophy'
  })
];

// Combined content library
export const allSources = [...chabadSources, ...hebrewbooksSources];
```

---

## 🎨 **Unified Viewer Component**

```tsx
// components/UnifiedContentViewer.tsx
'use client';

import { useState } from 'react';
import { ContentSource } from '@/lib/unified-content';
import { HebrewBooksAPI } from '@/lib/hebrewbooks-api';
import YourChabadViewer from './YourChabadViewer'; // Your existing component

export default function UnifiedContentViewer({ source }: { source: ContentSource }) {
  const [isLoading, setIsLoading] = useState(false);

  if (source.type === 'chabad') {
    // Your existing Chabad viewer - NO CHANGES NEEDED
    return <YourChabadViewer source={source} />;
  }
  
  if (source.type === 'hebrewbooks') {
    // New HebrewBooks viewer
    return <HebrewBooksViewer source={source} />;
  }
  
  return <div>Unknown source type: {source.type}</div>;
}

function HebrewBooksViewer({ source }: { source: ContentSource }) {
  const [currentPage, setCurrentPage] = useState(1);
  
  if (!source.urls?.viewer) {
    return <div>No viewer URL available</div>;
  }
  
  return (
    <div className="hebrewbooks-viewer">
      <div className="viewer-header">
        <h2>{source.title}</h2>
        {source.author && <p>Author: {source.author}</p>}
        
        <div className="viewer-controls">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
            ← Previous
          </button>
          <span>Page {currentPage}</span>
          <button onClick={() => setCurrentPage(currentPage + 1)}>
            Next →
          </button>
        </div>
        
        <div className="viewer-links">
          <a href={source.urls.book} target="_blank" rel="noopener noreferrer">
            📖 View on HebrewBooks
          </a>
          <a href={source.urls.download} target="_blank" rel="noopener noreferrer">
            📥 Download PDF
          </a>
        </div>
      </div>
      
      <div className="viewer-content">
        <iframe
          key={currentPage}
          src={`${source.urls.viewer}&pgnum=${currentPage}`}
          width="100%"
          height="600px"
          frameBorder="0"
          style={{ border: '1px solid #ddd', borderRadius: '4px' }}
        />
      </div>
    </div>
  );
}
```

---

## 🔍 **Unified Search Component**

```tsx
// components/ContentSearch.tsx
'use client';

import { useState } from 'react';
import { allSources } from '@/lib/unified-content';
import UnifiedContentViewer from './UnifiedContentViewer';

export default function ContentSearch() {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  
  const filteredSources = allSources.filter(source =>
    source.title.toLowerCase().includes(query.toLowerCase()) ||
    source.author?.toLowerCase().includes(query.toLowerCase())
  );
  
  if (selectedSource) {
    return (
      <div>
        <button onClick={() => setSelectedSource(null)}>
          ← Back to Search Results
        </button>
        <UnifiedContentViewer source={selectedSource} />
      </div>
    );
  }
  
  return (
    <div className="content-search">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Chabad and HebrewBooks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <div className="search-results">
        {filteredSources.map((source) => (
          <div key={source.id} className="result-card">
            {source.type === 'hebrewbooks' && source.urls?.cover && (
              <img
                src={source.urls.cover}
                alt={source.title}
                style={{ width: '100px', height: '140px', objectFit: 'cover' }}
              />
            )}
            
            <div className="result-info">
              <h3>{source.title}</h3>
              {source.author && <p>{source.author}</p>}
              <span className="source-type">{source.type}</span>
              
              <button onClick={() => setSelectedSource(source)}>
                View Content
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📄 **Page Integration Example**

```tsx
// app/sefarim/page.tsx
import ContentSearch from '@/components/ContentSearch';

export default function SefarimPage() {
  return (
    <div className="sefarim-page">
      <h1>Chabad & HebrewBooks Library</h1>
      <p>Access both Chabad.org content and HebrewBooks sefarim in one place</p>
      
      <ContentSearch />
    </div>
  );
}
```

---

## 🎯 **Key Benefits**

### ✅ **Safe Integration**
- **No breaking changes** to existing Chabad code
- **Frontend-only** implementation
- **Works in browser** without server setup

### ✅ **Unified Experience**
- **Single search** across both sources
- **Consistent UI** for all content types
- **Easy navigation** between sources

### ✅ **Future-Proof**
- **Extensible** to add more sources
- **Maintainable** separation of concerns
- **Scalable** architecture

---

## 🚀 **Quick Start**

1. **Copy the unified interface** to your project
2. **Add HebrewBooks sources** to your content library
3. **Use UnifiedContentViewer** in your pages
4. **Test in browser** - no server changes needed!

---

## 📞 **Integration Support**

- **Existing Chabad code**: No changes required
- **New HebrewBooks content**: Drop-in integration
- **Unified search**: Works across both sources
- **Frontend safe**: No API keys or server setup needed
