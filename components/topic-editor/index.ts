// Topic Editor Components - Centralized exports

export * from './types';

// Core components
export { TopicRelationshipManager } from './TopicRelationshipManager';
export { SourceLinker } from './SourceLinker';
export { ConceptTagger } from './ConceptTagger';
export { DisplayFormatSelector } from './DisplayFormatSelector';
export { TopicCompleteness } from './TopicCompleteness';
export { TopicVersionHistory } from './TopicVersionHistory';
export { TopicHierarchyTree } from './TopicHierarchyTree';
export { ScholarlyTab } from './ScholarlyTab';
export { ProactiveSuggestionsPanel } from '../editor/ProactiveSuggestionsPanel';
export { AIContentGeneratorDialog } from '../editor/AIContentGeneratorDialog';
export { AIRelationshipFinderDialog } from '../editor/AIRelationshipFinderDialog';
export { AICitationSuggestorDialog } from '../editor/AICitationSuggestorDialog';
export { RelationshipPredictionsPanel } from '../editor/RelationshipPredictionsPanel';
export { SmartCitationFinder } from '../editor/SmartCitationFinder';
export { FloatingAIChatButton } from '../editor/FloatingAIChatButton';
export { AIChatPanel } from '../editor/AIChatPanel';
export { SmartFieldInput } from '../editor/SmartFieldInput';

// New modular components
export { TopicEditorHeader } from './TopicEditorHeader';
export { TopicEditorTabs } from './TopicEditorTabs';
export { TopicEditorSidebar } from './TopicEditorSidebar';

// Section components
export * from './sections';

// AI components
export * from './ai';

// Hooks
export { useAutoSave, useSaveShortcut } from './useAutoSave';
export * from './hooks';
