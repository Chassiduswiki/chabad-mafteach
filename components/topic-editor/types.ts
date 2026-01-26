/**
 * Topic Editor Type Definitions
 * Centralized types for the scholar-facing topic editor system
 */

import { Topic, TopicRelationship, Source, Author } from '@/lib/types';

// ============ Display Configuration ============

export type DisplayFormat = 
  | 'prose'      // Standard paragraph text
  | 'list'       // Bullet or numbered list
  | 'table'      // Tabular data
  | 'accordion'  // Collapsible sections
  | 'timeline'   // Chronological display
  | 'comparison' // Side-by-side comparison
  | 'cards'      // Card-based grid layout
  | 'hierarchy'; // Nested tree structure

export interface DisplayConfig {
  format: DisplayFormat;
  columns?: string[];           // For table format
  collapsed?: boolean;          // For accordion format
  showNumbers?: boolean;        // For list format
  customClass?: string;         // Custom CSS class
  visible?: boolean;            // Section visibility
  sortOrder?: number;           // Display order
}

export interface SectionConfig {
  id: string;
  label: string;
  field: string;
  displayConfig: DisplayConfig;
  required?: boolean;
  helpText?: string;
}

// ============ Topic Editor State ============

export interface TopicEditorState {
  topic: Topic | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  lastSaved?: Date;
  activeTab: TopicEditorTab;
  validationErrors: Record<string, string>;
}

export type TopicEditorTab = 
  | 'overview'
  | 'content'
  | 'relationships'
  | 'sources'
  | 'display'
  | 'advanced';

// ============ Relationship Types ============

export type RelationType = 
  | 'subcategory'
  | 'instance_of'
  | 'part_of'
  | 'related_to'
  | 'sefirah_hierarchy'
  | 'chronological'
  | 'conceptual_parent'
  | 'opposite';

export const RELATION_TYPES: RelationType[] = [
  'subcategory',
  'instance_of',
  'part_of',
  'related_to',
  'sefirah_hierarchy',
  'chronological',
  'conceptual_parent',
  'opposite',
];

export const isRelationType = (value: string): value is RelationType => {
  return RELATION_TYPES.includes(value as RelationType);
};

export interface TopicRelationshipWithDetails extends TopicRelationship {
  parentTopic?: Topic;
  childTopic?: Topic;
}

export interface RelationshipFormData {
  relatedTopicId: number | null;
  relationType: RelationType;
  strength: number;
  description: string;
  direction: 'parent' | 'child';
}

// ============ Source Linking ============

export interface SourceWithDetails extends Source {
  authorDetails?: Author;
}

export interface SourceLinkFormData {
  sourceId: number | null;
  relationshipType: 'quotes' | 'paraphrases' | 'references' | 'supports' | 'contradicts' | 'discusses';
  pageNumber?: string;
  verseReference?: string;
  notes?: string;
}

// ============ Concept Tagging ============

export interface ConceptTag {
  id: number;
  name: string;
  type: 'primary' | 'secondary' | 'related';
  relevanceScore: number;
}

// ============ Progress & Completeness ============

export interface TopicCompleteness {
  overall: number;           // 0-100
  sections: {
    basicInfo: number;
    content: number;
    relationships: number;
    sources: number;
    display: number;
  };
  missingFields: string[];
  suggestions: string[];
}

// ============ Form Data ============

export interface TopicFormData {
  canonical_title: string;
  canonical_title_en?: string;
  canonical_title_transliteration?: string;
  name_hebrew?: string;
  slug: string;
  topic_type: string;
  description: string;
  description_en?: string;
  definition_positive?: string;
  definition_negative?: string;
  overview?: string;
  article?: string;
  practical_takeaways?: string;
  historical_context?: string;
  mashal?: string;
  global_nimshal?: string;
  charts?: string;
  common_confusions?: { question: string; answer: string }[];
  content_status?: 'minimal' | 'partial' | 'comprehensive';
  status_label?: string;
  badge_color?: string;
  status?: 'draft' | 'reviewed' | 'published' | 'archived';
  metadata?: Record<string, unknown>;
}

// ============ API Response Types ============

export interface TopicSearchResult {
  id: number;
  canonical_title: string;
  slug: string;
  topic_type?: string;
  description?: string;
}

export interface SourceSearchResult {
  id: number;
  title: string;
  author?: string;
  publication_year?: number;
  external_system?: string;
}

// ============ Event Handlers ============

export interface TopicEditorCallbacks {
  onSave: (data: TopicFormData) => Promise<void>;
  onAutoSave?: (data: TopicFormData) => Promise<void>;
  onAddRelationship: (data: RelationshipFormData) => Promise<void>;
  onRemoveRelationship: (relationshipId: number) => Promise<void>;
  onLinkSource: (data: SourceLinkFormData) => Promise<void>;
  onUnlinkSource: (linkId: number) => Promise<void>;
  onUpdateDisplayConfig: (sectionId: string, config: DisplayConfig) => Promise<void>;
}
