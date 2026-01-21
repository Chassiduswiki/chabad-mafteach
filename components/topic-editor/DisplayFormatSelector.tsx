'use client';

import React, { useState } from 'react';
import { 
  AlignLeft, List, Table, ChevronDown, LayoutGrid, 
  Clock, GitBranch, Eye, EyeOff, Settings, GripVertical,
  Circle, CheckCircle, MinusCircle
} from 'lucide-react';
import { DisplayFormat, DisplayConfig, SectionConfig } from './types';
import { 
  computeSmartVisibility, 
  getVisibilityStatusText, 
  getVisibilityStatusColor,
  SmartVisibilityResult 
} from '@/lib/utils/smart-visibility';

interface DisplayFormatSelectorProps {
  sections: SectionConfig[];
  formData?: Record<string, any>; // Topic form data to check content
  onUpdateSection: (sectionId: string, config: Partial<DisplayConfig>) => void;
  onReorderSections?: (sectionIds: string[]) => void;
}

const FORMAT_OPTIONS: { value: DisplayFormat; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'prose', label: 'Prose', icon: AlignLeft, description: 'Standard paragraph text' },
  { value: 'list', label: 'List', icon: List, description: 'Bullet or numbered list' },
  { value: 'table', label: 'Table', icon: Table, description: 'Tabular data display' },
  { value: 'accordion', label: 'Accordion', icon: ChevronDown, description: 'Collapsible sections' },
  { value: 'cards', label: 'Cards', icon: LayoutGrid, description: 'Card-based grid' },
  { value: 'timeline', label: 'Timeline', icon: Clock, description: 'Chronological display' },
  { value: 'hierarchy', label: 'Hierarchy', icon: GitBranch, description: 'Nested tree structure' },
];

export const DisplayFormatSelector: React.FC<DisplayFormatSelectorProps> = ({
  sections,
  formData = {},
  onUpdateSection,
  onReorderSections,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  // Compute smart visibility for each section
  const getVisibility = (section: SectionConfig): SmartVisibilityResult => {
    const fieldValue = formData[section.field];
    return computeSmartVisibility(fieldValue, section.displayConfig.visible);
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) return;
  };

  const handleDrop = (targetSectionId: string) => {
    if (!draggedSection || !onReorderSections) return;

    const currentOrder = sections.map(s => s.id);
    const draggedIndex = currentOrder.indexOf(draggedSection);
    const targetIndex = currentOrder.indexOf(targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);

    onReorderSections(newOrder);
    setDraggedSection(null);
  };

  const getFormatIcon = (format: DisplayFormat) => {
    const option = FORMAT_OPTIONS.find(o => o.value === format);
    return option?.icon || AlignLeft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Display Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how each content section is displayed on the frontend
        </p>
      </div>

      {/* Section List */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const FormatIcon = getFormatIcon(section.displayConfig.format);
          const visibility = getVisibility(section);
          const statusText = getVisibilityStatusText(visibility);
          const statusColor = getVisibilityStatusColor(visibility);
          const isVisible = visibility?.isVisible ?? true;

          return (
            <div
              key={section.id}
              draggable={!!onReorderSections}
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDrop={() => handleDrop(section.id)}
              className={`border rounded-lg transition-all ${
                draggedSection === section.id
                  ? 'opacity-50 border-primary'
                  : 'border-border hover:border-primary/50'
              } ${!isVisible ? 'opacity-60' : ''}`}
            >
              {/* Section Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              >
                {onReorderSections && (
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                )}
                
                <div className="flex items-center gap-2 flex-1">
                  <FormatIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{section.label}</span>
                  {section.required && (
                    <span className="text-xs text-primary">Required</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Smart Visibility Status */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${statusColor}`}>
                      {statusText}
                    </span>
                    {/* Manual Hide Toggle (only for filled fields) */}
                    {visibility.hasContent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle manual hide - if currently visible, hide it; if manually hidden, show it
                          onUpdateSection(section.id, { visible: !isVisible });
                        }}
                        className={`p-1.5 rounded hover:bg-muted transition-colors ${
                          isVisible ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                        title={isVisible ? 'Hide this section' : 'Show this section'}
                      >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {/* Format Badge */}
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {section.displayConfig.format}
                  </span>

                  {/* Expand Arrow */}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Settings */}
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Display Format
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FORMAT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = section.displayConfig.format === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => onUpdateSection(section.id, { format: option.value })}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format-Specific Options */}
                  {section.displayConfig.format === 'list' && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.displayConfig.showNumbers || false}
                          onChange={(e) => onUpdateSection(section.id, { showNumbers: e.target.checked })}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Show numbers (ordered list)</span>
                      </label>
                    </div>
                  )}

                  {section.displayConfig.format === 'accordion' && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.displayConfig.collapsed || false}
                          onChange={(e) => onUpdateSection(section.id, { collapsed: e.target.checked })}
                          className="rounded border-border"
                        />
                        <span className="text-sm">Start collapsed</span>
                      </label>
                    </div>
                  )}

                  {section.displayConfig.format === 'table' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Table Columns (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(section.displayConfig.columns || []).join(', ')}
                        onChange={(e) => onUpdateSection(section.id, {
                          columns: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                        })}
                        placeholder="e.g., Term, Definition, Source"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}

                  {/* Custom CSS Class */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Custom CSS Class (optional)
                    </label>
                    <input
                      type="text"
                      value={section.displayConfig.customClass || ''}
                      onChange={(e) => onUpdateSection(section.id, { customClass: e.target.value })}
                      placeholder="e.g., highlight-section, two-column"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add custom styling classes for specialty pages
                    </p>
                  </div>

                  {/* Help Text */}
                  {section.helpText && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      {section.helpText}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Presets */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              sections.forEach(section => {
                onUpdateSection(section.id, { format: 'prose', visible: true });
              });
            }}
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            All Prose
          </button>
          <button
            onClick={() => {
              sections.forEach(section => {
                onUpdateSection(section.id, { visible: true });
              });
            }}
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => {
              const essentialFields = ['description', 'overview', 'article'];
              sections.forEach(section => {
                onUpdateSection(section.id, { 
                  visible: essentialFields.includes(section.field) 
                });
              });
            }}
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisplayFormatSelector;
