'use client';

import React from 'react';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ExploreFilters,
    TopicType,
    RelationshipType,
    LayoutMode,
    TOPIC_TYPE_CONFIG,
    RELATIONSHIP_TYPE_CONFIG,
    LAYOUT_CONFIG,
} from './types';

interface FilterPanelProps {
    filters: ExploreFilters;
    onToggleTopicType: (type: TopicType) => void;
    onToggleRelationshipType: (type: RelationshipType) => void;
    onSetLayout: (layout: LayoutMode) => void;
    onSetDepth: (depth: number) => void;
    onReset: () => void;
    hasActiveFilters: boolean;
    className?: string;
    compact?: boolean; // For mobile chip-style display
}

/**
 * FilterPanel - Controls for filtering the explore graph
 * Can render in full sidebar mode or compact chip mode
 */
export function FilterPanel({
    filters,
    onToggleTopicType,
    onToggleRelationshipType,
    onSetLayout,
    onSetDepth,
    onReset,
    hasActiveFilters,
    className,
    compact = false,
}: FilterPanelProps) {
    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
        types: true,
        relationships: true,
        layout: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (compact) {
        return <CompactFilters filters={filters} onToggleTopicType={onToggleTopicType} />;
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-semibold text-sm">Filters</h2>
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Topic Types */}
                <FilterSection
                    title="Topic Types"
                    expanded={expandedSections.types}
                    onToggle={() => toggleSection('types')}
                >
                    <div className="space-y-1">
                        {(Object.keys(TOPIC_TYPE_CONFIG) as TopicType[]).map(type => (
                            <FilterCheckbox
                                key={type}
                                checked={filters.topicTypes.includes(type)}
                                onChange={() => onToggleTopicType(type)}
                                label={TOPIC_TYPE_CONFIG[type].label}
                                color={TOPIC_TYPE_CONFIG[type].color}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Relationship Types */}
                <FilterSection
                    title="Relationships"
                    expanded={expandedSections.relationships}
                    onToggle={() => toggleSection('relationships')}
                >
                    <div className="space-y-1">
                        {(Object.keys(RELATIONSHIP_TYPE_CONFIG) as RelationshipType[]).map(type => (
                            <FilterCheckbox
                                key={type}
                                checked={filters.relationshipTypes.includes(type)}
                                onChange={() => onToggleRelationshipType(type)}
                                label={RELATIONSHIP_TYPE_CONFIG[type].label}
                                subtitle={RELATIONSHIP_TYPE_CONFIG[type].description}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Layout */}
                <FilterSection
                    title="Layout"
                    expanded={expandedSections.layout}
                    onToggle={() => toggleSection('layout')}
                >
                    <div className="space-y-1">
                        {(Object.keys(LAYOUT_CONFIG) as LayoutMode[]).map(layout => (
                            <FilterRadio
                                key={layout}
                                checked={filters.layout === layout}
                                onChange={() => onSetLayout(layout)}
                                label={LAYOUT_CONFIG[layout].label}
                                subtitle={LAYOUT_CONFIG[layout].description}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Depth slider */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Connection Depth</span>
                        <span className="text-xs text-muted-foreground">{filters.depth} levels</span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={5}
                        value={filters.depth}
                        onChange={e => onSetDepth(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Focused</span>
                        <span>Expanded</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Collapsible section wrapper
function FilterSection({
    title,
    expanded,
    onToggle,
    children,
}: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-border">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
                <span className="text-sm font-medium">{title}</span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>
            {expanded && <div className="px-4 pb-3">{children}</div>}
        </div>
    );
}

// Checkbox item
function FilterCheckbox({
    checked,
    onChange,
    label,
    subtitle,
    color,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
    subtitle?: string;
    color?: string;
}) {
    return (
        <label className="flex items-start gap-3 py-1.5 cursor-pointer group">
            <div className="relative flex items-center justify-center w-4 h-4 mt-0.5">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <div
                    className={cn(
                        'w-4 h-4 rounded border-2 transition-all',
                        checked
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                    )}
                >
                    {checked && (
                        <svg
                            className="w-full h-full text-primary-foreground"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M4 8l3 3 5-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {color && (
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                        />
                    )}
                    <span className="text-sm">{label}</span>
                </div>
                {subtitle && (
                    <span className="text-xs text-muted-foreground">{subtitle}</span>
                )}
            </div>
        </label>
    );
}

// Radio item
function FilterRadio({
    checked,
    onChange,
    label,
    subtitle,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
    subtitle?: string;
}) {
    return (
        <label className="flex items-start gap-3 py-1.5 cursor-pointer group">
            <div className="relative flex items-center justify-center w-4 h-4 mt-0.5">
                <input
                    type="radio"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only"
                />
                <div
                    className={cn(
                        'w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center',
                        checked
                            ? 'border-primary'
                            : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
                    )}
                >
                    {checked && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-sm">{label}</span>
                {subtitle && (
                    <span className="block text-xs text-muted-foreground">{subtitle}</span>
                )}
            </div>
        </label>
    );
}

// Compact chip-style filters for mobile
function CompactFilters({
    filters,
    onToggleTopicType,
}: {
    filters: ExploreFilters;
    onToggleTopicType: (type: TopicType) => void;
}) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(Object.keys(TOPIC_TYPE_CONFIG) as TopicType[]).map(type => {
                const isActive = filters.topicTypes.includes(type);
                const config = TOPIC_TYPE_CONFIG[type];
                return (
                    <button
                        key={type}
                        onClick={() => onToggleTopicType(type)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                    >
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isActive ? 'currentColor' : config.color }}
                        />
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
}

export default FilterPanel;
