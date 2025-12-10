# TorahReader Component Documentation

## Overview

The TorahReader is a comprehensive, reusable component for displaying Hebrew texts (seforim) with advanced reading features. It provides a premium reading experience with interactive citations, progress tracking, and mobile optimization.

## Architecture

The TorahReader consists of two main implementations:

### 1. Core TorahReader Component (`/components/TorahReader.tsx`)
A generalized, reusable component that can display any text content with interactive features.

### 2. Advanced TorahReader Page (`/seforim/[seferId]/page.tsx`)
A full-featured page implementation with virtual scrolling, settings panels, and comprehensive citation handling.

## Props Interface

### TorahReaderProps

```typescript
interface TorahReaderProps {
  // Document info
  documentTitle: string;           // Title of the sefer/document
  documentType?: string;           // Optional type (e.g., "Tanya", "Mishneh Torah")

  // Content structure - flexible for any sefer
  sections: Array<{
    id: number;                    // Unique section identifier
    title?: string;                // Optional section title
    order_key: string;             // Section ordering (numeric string)
    statements: StatementWithTopics[]; // Content statements
  }>;

  // Navigation info
  currentSection: number;          // Current section being displayed
  totalSections?: number;          // Total sections in document

  // Related content
  topicsInDocument: Topic[];       // Topics linked to this document
  sources: Array<{                 // Sources/citations for the document
    id: number;
    title: string;
    external_url?: string | null;
  }>;

  // UI state
  isLoading?: boolean;             // Loading state for skeleton display
}
```

### StatementWithTopics

```typescript
interface StatementWithTopics {
  id: number;                      // Statement ID
  order_key: string;               // Ordering within section
  text: string;                    // Hebrew text content
  topics: Topic[];                 // Linked topics
  sources: {                       // Citation sources
    id: number;
    title: string;
    external_url?: string | null;
    relationship_type?: string;
    page_number?: string;
    verse_reference?: string;
  }[];
}
```

## Features

### Core Features
- **Interactive Reading**: Click any sentence to explore topics and sources
- **Progress Tracking**: Visual progress bar and reading completion metrics
- **Responsive Design**: Optimized for desktop and mobile experiences
- **Theme Integration**: Follows app's dark/light theme system

### Advanced Features (Page Implementation)
- **Virtual Scrolling**: Performance optimized for large texts
- **Citation System**: Integrated Sefaria references with modal display
- **Reading Settings**: Font size controls, citation visibility toggles
- **Mobile Bottom Sheets**: Native-feeling modals for content details
- **Real-time Statistics**: Reading progress, content metrics
- **Accessibility**: Keyboard navigation, screen reader support

### Mobile Experience
- **Touch-Optimized**: Large touch targets and swipe gestures
- **Bottom Sheet Modals**: Native mobile interaction patterns
- **Responsive Typography**: Optimized font sizes for mobile screens

## Usage Examples

### Basic Usage

```tsx
import { TorahReader } from '@/components/TorahReader';

function MySeferPage() {
  const sections = [
    {
      id: 1,
      title: "Chapter 1",
      order_key: "1",
      statements: [
        {
          id: 1,
          order_key: "1",
          text: "בראשית ברא אלהים את השמים ואת הארץ",
          topics: [{ id: 1, name: "Creation" }],
          sources: []
        }
      ]
    }
  ];

  return (
    <TorahReader
      documentTitle="Genesis"
      documentType="Torah"
      sections={sections}
      currentSection={1}
      totalSections={50}
      topicsInDocument={[]}
      sources={[]}
    />
  );
}
```

### Advanced Usage with Directus

```tsx
// In a Next.js page component
export default function SeferPage({ params }: { params: { seferId: string } }) {
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocument(params.seferId);
  }, [params.seferId]);

  const sections = document?.paragraphs?.map(paragraph => ({
    id: paragraph.id,
    title: paragraph.title,
    order_key: paragraph.order_key,
    statements: paragraph.statements || []
  })) || [];

  return (
    <TorahReader
      documentTitle={document?.title}
      documentType={document?.doc_type}
      sections={sections}
      currentSection={1}
      totalSections={sections.length}
      topicsInDocument={[]} // Fetch from API
      sources={[]} // Fetch from API
      isLoading={isLoading}
    />
  );
}
```

## Data Structure Integration

### Directus Collections

The TorahReader expects data from these Directus collections:

- **`documents`**: Main sefer/document records
- **`paragraphs`**: Chapters/sections within documents
- **`statements`**: Individual text blocks with citations
- **`topics`**: Conceptual topics linked to statements
- **`sources`**: Citation sources and references

### Expected Data Flow

```
Document (sefer)
├── Paragraph (chapter/section)
│   ├── Statement (text block)
│   │   ├── Topics (concepts)
│   │   └── Sources (citations)
│   └── Statement (text block)
│       └── ...
└── Paragraph (chapter/section)
    └── ...
```

## Future Extensibility

The TorahReader is designed with future enhancements in mind:

### Translation Support
- **Architecture Ready**: Component structure supports multiple languages
- **Toggle Implementation**: Easy to add Hebrew/English switching
- **Side-by-Side Display**: Layout prepared for parallel text display

### Commentary Integration
- **Block Types**: Statement interface supports different content types
- **Inline Comments**: Structure ready for commentary insertion
- **Source Attribution**: Citation system extensible for commentary sources

### Annotation System
- **User Notes**: Framework prepared for user annotations
- **Highlighting**: Text selection ready for note attachment
- **Sharing**: Architecture supports collaborative annotations

### Audio Features
- **Text-to-Speech**: Component structure ready for audio integration
- **Playback Controls**: UI patterns prepared for audio controls
- **Bookmarking**: Reading position tracking for audio resume

### Collaboration Features
- **Multi-user Editing**: Component framework supports collaborative features
- **Comment Threads**: UI patterns ready for discussion features
- **Version Control**: Architecture prepared for content versioning

## Performance Considerations

### Virtual Scrolling
- Large texts use intersection observers for smooth scrolling
- Content loads progressively to maintain performance
- Memory usage optimized for mobile devices

### Image Optimization
- Citation images lazy-loaded when needed
- Modal content loaded on demand
- Bundle size optimized for initial page load

### Caching Strategy
- Document content cached in memory during reading
- Reading progress persisted in localStorage
- API responses cached for offline reading

## Accessibility

### WCAG Compliance
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic markup
- **Focus Management**: Logical tab order and focus trapping in modals

### Mobile Accessibility
- **Touch Targets**: Minimum 44px touch targets on mobile
- **Gesture Support**: Standard swipe gestures for navigation
- **High Contrast**: Theme system supports accessibility preferences

## Testing

### Component Testing
- Unit tests for core functionality
- Integration tests for Directus data flow
- E2E tests for complete reading workflows

### Performance Testing
- Bundle size monitoring
- Runtime performance benchmarks
- Memory usage analysis for large texts

### Accessibility Testing
- Automated accessibility audits
- Manual testing with assistive technologies
- Cross-browser compatibility testing

## Migration Guide

### From Tanya-specific Implementation
1. Replace `TanyaChapterReader` imports with `TorahReader`
2. Update props to use new `TorahReaderProps` interface
3. Convert chapter-based data to section-based structure
4. Update routing to use generic `/seforim/[seferId]` pattern

### Data Structure Migration
1. Ensure Directus collections follow expected schema
2. Update API endpoints to return compatible data structure
3. Migrate existing content to new paragraph/statement format
4. Update topic and source relationships

## API Integration

### Required API Endpoints
- `GET /api/documents/[id]` - Fetch document with paragraphs and statements
- `GET /api/topics?document_id=[id]` - Fetch topics for document
- `GET /api/sources?document_id=[id]` - Fetch sources for document

### Optional API Endpoints
- `POST /api/reading-progress` - Save reading progress
- `POST /api/annotations` - Save user annotations
- `GET /api/translations/[id]` - Fetch translations

## Customization

### Theming
- CSS custom properties for consistent styling
- Theme-aware components that respect user preferences
- Extensible color schemes for different reading modes

### Configuration
- Reading settings persisted per user
- Customizable display options
- Font and layout preferences

### Extensions
- Plugin system for additional features
- Custom content renderers
- Third-party integration hooks
