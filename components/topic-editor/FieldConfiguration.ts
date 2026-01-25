export interface FieldConfig {
  id: string;
  label: string;
  field: string;
  required: boolean;
  priority: 'high' | 'medium' | 'low';
  group: string;
  helpText?: string;
  characterLimit?: number;
  dependencies?: string[];
  conditional?: (formData: any) => boolean;
}

export const FIELD_CONFIG: FieldConfig[] = [
  // Essential Information
  {
    id: 'canonical_title',
    label: 'Title (Hebrew)',
    field: 'canonical_title',
    required: true,
    priority: 'high',
    group: 'essential',
    helpText: 'Primary title in Hebrew script - appears in search results and page headers'
  },
  {
    id: 'canonical_title_en',
    label: 'Title (English)',
    field: 'canonical_title_en',
    required: false,
    priority: 'high',
    group: 'essential',
    helpText: 'English translation of the title'
  },
  {
    id: 'topic_type',
    label: 'Topic Type',
    field: 'topic_type',
    required: true,
    priority: 'high',
    group: 'essential',
    helpText: 'Classification of the topic (concept, person, place, etc.)'
  },
  {
    id: 'description',
    label: 'Short Description',
    field: 'description',
    required: true,
    priority: 'high',
    group: 'essential',
    helpText: 'Brief overview for search results and social sharing (150-200 chars recommended)',
    characterLimit: 200
  },
  {
    id: 'slug',
    label: 'URL Slug',
    field: 'slug',
    required: true,
    priority: 'high',
    group: 'essential',
    helpText: 'URL-friendly identifier for the topic'
  },
  
  // Core Definitions
  {
    id: 'definition_positive',
    label: 'What It Is',
    field: 'definition_positive',
    required: true,
    priority: 'high',
    group: 'core',
    helpText: 'Define what this concept encompasses'
  },
  {
    id: 'definition_negative',
    label: 'What It\'s Not',
    field: 'definition_negative',
    required: false,
    priority: 'high',
    group: 'core',
    helpText: 'Clarify boundaries and common confusions'
  },
  
  // Main Content
  {
    id: 'overview',
    label: 'Overview',
    field: 'overview',
    required: false,
    priority: 'medium',
    group: 'main',
    helpText: 'Detailed explanation of the topic'
  },
  {
    id: 'article',
    label: 'Article',
    field: 'article',
    required: false,
    priority: 'medium',
    group: 'main',
    helpText: 'In-depth article content'
  },
  
  // Practical Application
  {
    id: 'practical_takeaways',
    label: 'Practical Takeaways',
    field: 'practical_takeaways',
    required: false,
    priority: 'medium',
    group: 'practical',
    helpText: 'Actionable insights and key points'
  },
  {
    id: 'historical_context',
    label: 'Historical Context',
    field: 'historical_context',
    required: false,
    priority: 'medium',
    group: 'practical',
    helpText: 'Historical background and development'
  },
  
  // Advanced Content
  {
    id: 'mashal',
    label: 'Mashal (Parable)',
    field: 'mashal',
    required: false,
    priority: 'low',
    group: 'advanced',
    helpText: 'Illustrative parable or analogy'
  },
  {
    id: 'global_nimshal',
    label: 'Nimshal (Application)',
    field: 'global_nimshal',
    required: false,
    priority: 'low',
    group: 'advanced',
    helpText: 'Real-world application of the parable'
  },
  {
    id: 'charts',
    label: 'Charts & Tables',
    field: 'charts',
    required: false,
    priority: 'low',
    group: 'advanced',
    helpText: 'Structured data displays and comparisons'
  },
  
  // Metadata & Technical
  {
    id: 'canonical_title_transliteration',
    label: 'Transliteration',
    field: 'canonical_title_transliteration',
    required: false,
    priority: 'low',
    group: 'metadata',
    helpText: 'Auto-generated from Hebrew title'
  },
  {
    id: 'content_status',
    label: 'Content Status',
    field: 'content_status',
    required: false,
    priority: 'low',
    group: 'metadata',
    helpText: 'Workflow tracking (minimal, partial, comprehensive)'
  },
  {
    id: 'status_label',
    label: 'Status Label',
    field: 'status_label',
    required: false,
    priority: 'low',
    group: 'metadata',
    helpText: 'Custom status indicator'
  },
  {
    id: 'badge_color',
    label: 'Badge Color',
    field: 'badge_color',
    required: false,
    priority: 'low',
    group: 'metadata',
    helpText: 'Visual indicator color for status badges'
  },
];

export const FIELD_GROUPS = {
  essential: {
    title: 'Essential Information',
    defaultOpen: true,
    priority: 1,
  },
  core: {
    title: 'Core Definitions',
    defaultOpen: true,
    priority: 2,
  },
  main: {
    title: 'Main Content',
    defaultOpen: false,
    priority: 3,
  },
  practical: {
    title: 'Practical Application',
    defaultOpen: false,
    priority: 4,
  },
  advanced: {
    title: 'Advanced Content',
    defaultOpen: false,
    priority: 5,
  },
  metadata: {
    title: 'Metadata & Technical',
    defaultOpen: false,
    priority: 6,
  },
};
