import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global Selection Store
 * 
 * Manages selected items across the application with persistence.
 * Supports topics, statements, and other entity types.
 * 
 * @example
 * ```tsx
 * const { selectedTopics, toggleTopic, clearSelection } = useSelectionStore();
 * 
 * // Toggle selection
 * toggleTopic(topicId);
 * 
 * // Check if selected
 * const isSelected = selectedTopics.includes(topicId);
 * 
 * // Clear all
 * clearSelection('topics');
 * ```
 */

interface SelectionState {
    // Selected items by type
    selectedTopics: number[];
    selectedStatements: number[];
    selectedSources: number[];

    // Actions for topics
    toggleTopic: (id: number) => void;
    selectTopics: (ids: number[]) => void;
    deselectTopics: (ids: number[]) => void;
    clearTopics: () => void;

    // Actions for statements
    toggleStatement: (id: number) => void;
    selectStatements: (ids: number[]) => void;
    deselectStatements: (ids: number[]) => void;
    clearStatements: () => void;

    // Actions for sources
    toggleSource: (id: number) => void;
    selectSources: (ids: number[]) => void;
    deselectSources: (ids: number[]) => void;
    clearSources: () => void;

    // Clear all selections
    clearAll: () => void;
}

export const useSelectionStore = create<SelectionState>()(
    persist(
        (set) => ({
            // Initial state
            selectedTopics: [],
            selectedStatements: [],
            selectedSources: [],

            // Topic actions
            toggleTopic: (id) =>
                set((state) => ({
                    selectedTopics: state.selectedTopics.includes(id)
                        ? state.selectedTopics.filter((topicId) => topicId !== id)
                        : [...state.selectedTopics, id],
                })),

            selectTopics: (ids) =>
                set((state) => ({
                    selectedTopics: [...new Set([...state.selectedTopics, ...ids])],
                })),

            deselectTopics: (ids) =>
                set((state) => ({
                    selectedTopics: state.selectedTopics.filter((id) => !ids.includes(id)),
                })),

            clearTopics: () => set({ selectedTopics: [] }),

            // Statement actions
            toggleStatement: (id) =>
                set((state) => ({
                    selectedStatements: state.selectedStatements.includes(id)
                        ? state.selectedStatements.filter((statementId) => statementId !== id)
                        : [...state.selectedStatements, id],
                })),

            selectStatements: (ids) =>
                set((state) => ({
                    selectedStatements: [...new Set([...state.selectedStatements, ...ids])],
                })),

            deselectStatements: (ids) =>
                set((state) => ({
                    selectedStatements: state.selectedStatements.filter((id) => !ids.includes(id)),
                })),

            clearStatements: () => set({ selectedStatements: [] }),

            // Source actions
            toggleSource: (id) =>
                set((state) => ({
                    selectedSources: state.selectedSources.includes(id)
                        ? state.selectedSources.filter((sourceId) => sourceId !== id)
                        : [...state.selectedSources, id],
                })),

            selectSources: (ids) =>
                set((state) => ({
                    selectedSources: [...new Set([...state.selectedSources, ...ids])],
                })),

            deselectSources: (ids) =>
                set((state) => ({
                    selectedSources: state.selectedSources.filter((id) => !ids.includes(id)),
                })),

            clearSources: () => set({ selectedSources: [] }),

            // Clear all
            clearAll: () =>
                set({
                    selectedTopics: [],
                    selectedStatements: [],
                    selectedSources: [],
                }),
        }),
        {
            name: 'selection-storage', // localStorage key
            partialize: (state) => ({
                // Only persist selections, not actions
                selectedTopics: state.selectedTopics,
                selectedStatements: state.selectedStatements,
                selectedSources: state.selectedSources,
            }),
        }
    )
);
