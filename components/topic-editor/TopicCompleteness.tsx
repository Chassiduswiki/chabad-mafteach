'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Circle, TrendingUp, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicCompleteness as CompletenessType, TopicFormData, SectionConfig } from './types';

interface TopicCompletenessProps {
  formData: TopicFormData;
  relationshipCount?: number;
  sourceCount?: number;
  className?: string;
  onGenerateField?: (fieldId: string) => void;
  isAICompleting?: boolean;
}

const FIELD_WEIGHTS: Record<string, { weight: number; section: keyof CompletenessType['sections']; label: string }> = {
  canonical_title: { weight: 10, section: 'basicInfo', label: 'Title' },
  slug: { weight: 5, section: 'basicInfo', label: 'Slug' },
  topic_type: { weight: 5, section: 'basicInfo', label: 'Type' },
  description: { weight: 15, section: 'content', label: 'Description' },
  overview: { weight: 15, section: 'content', label: 'Overview' },
  article: { weight: 20, section: 'content', label: 'Article' },
  definition_positive: { weight: 10, section: 'content', label: 'Definition (What it is)' },
  definition_negative: { weight: 5, section: 'content', label: 'Definition (What it\'s not)' },
  common_confusions: { weight: 5, section: 'content', label: 'Common Confusions' },
  charts: { weight: 5, section: 'content', label: 'Charts & Tables' },
  practical_takeaways: { weight: 10, section: 'content', label: 'Practical Takeaways' },
  historical_context: { weight: 5, section: 'content', label: 'Historical Context' },
};

const SECTION_LABELS: Record<keyof CompletenessType['sections'], string> = {
  basicInfo: 'Basic Info',
  content: 'Content',
  relationships: 'Relationships',
  sources: 'Sources',
  display: 'Display',
};

export const TopicCompleteness: React.FC<TopicCompletenessProps> = ({
  formData,
  relationshipCount = 0,
  sourceCount = 0,
  className = '',
  onGenerateField,
  isAICompleting = false,
}) => {
  const calculateCompleteness = (): CompletenessType => {
    const sections: CompletenessType['sections'] = {
      basicInfo: 0,
      content: 0,
      relationships: 0,
      sources: 0,
      display: 0,
    };

    const missingFields: string[] = [];
    const suggestions: string[] = [];

    let totalWeight = 0;
    let achievedWeight = 0;

    // Calculate field completeness
    Object.entries(FIELD_WEIGHTS).forEach(([field, config]) => {
      totalWeight += config.weight;
      const value = formData[field as keyof TopicFormData];
      const hasValue = value && String(value).trim().length > 0;
      
      if (hasValue) {
        achievedWeight += config.weight;
        
        // Check content quality
        const strValue = String(value);
        if (config.section === 'content' && strValue.length < 100 && field !== 'common_confusions' && field !== 'charts') {
          suggestions.push(`Consider expanding ${config.label} (currently ${strValue.length} chars)`);
        }
      } else {
        missingFields.push(config.label);
      }
    });

    // Calculate section percentages
    const sectionWeights: Record<string, { total: number; achieved: number }> = {};
    
    Object.entries(FIELD_WEIGHTS).forEach(([field, config]) => {
      if (!sectionWeights[config.section]) {
        sectionWeights[config.section] = { total: 0, achieved: 0 };
      }
      sectionWeights[config.section].total += config.weight;
      
      const value = formData[field as keyof TopicFormData];
      if (value && String(value).trim().length > 0) {
        sectionWeights[config.section].achieved += config.weight;
      }
    });

    Object.entries(sectionWeights).forEach(([section, weights]) => {
      sections[section as keyof typeof sections] = Math.round(
        (weights.achieved / weights.total) * 100
      );
    });

    // Relationships: 0 = 0%, 1-2 = 50%, 3+ = 100%
    sections.relationships = relationshipCount >= 3 ? 100 : relationshipCount >= 1 ? 50 : 0;
    
    // Sources: 0 = 0%, 1-2 = 50%, 3+ = 100%
    sections.sources = sourceCount >= 3 ? 100 : sourceCount >= 1 ? 50 : 0;
    
    // Display is always "complete" (configurable via UI)
    sections.display = 100;

    // Generate suggestions
    if (!formData.description || formData.description.length < 50) {
      suggestions.push('Add a compelling description to help users understand the topic');
    }
    if (!formData.article) {
      suggestions.push('Write an article to provide in-depth coverage');
    }
    if (!formData.practical_takeaways) {
      suggestions.push('Add practical takeaways to make the content actionable');
    }
    if (!formData.definition_positive) {
      suggestions.push('Define what this concept encompasses');
    }

    const overall = Math.round((achievedWeight / totalWeight) * 100);

    return {
      overall,
      sections,
      missingFields,
      suggestions: suggestions.slice(0, 4),
    };
  };

  const completeness = calculateCompleteness();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (percentage >= 50) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Circle className="h-4 w-4 text-red-500" />;
  };

  const isFieldMissing = (field: string) => !formData[field as keyof TopicFormData];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress */}
      <div className="dashboard-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Completeness</h3>
          </div>
          <span className={`text-lg font-bold ${
            completeness.overall >= 80 ? 'text-green-500' :
            completeness.overall >= 50 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {completeness.overall}%
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(completeness.overall)}`}
            style={{ width: `${completeness.overall}%` }}
          />
        </div>

        {/* AI Quick Actions */}
        {completeness.overall < 100 && (
          <div className="mb-4">
            <Button 
              size="sm" 
              className="w-full h-8 text-xs rounded-lg shadow-sm bg-primary hover:shadow-primary/20 transition-all gap-1.5"
              onClick={() => window.dispatchEvent(new CustomEvent('ai-generate-all-missing'))}
              disabled={isAICompleting}
            >
              {isAICompleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              <span className="hidden sm:inline">Auto-generate Missing</span>
              <span className="sm:hidden">Auto-fill</span>
            </Button>
          </div>
        )}

        {/* Section Breakdown */}
        <div className="space-y-3">
          {Object.entries(completeness.sections).map(([section, percentage]) => (
            <div key={section} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(percentage)}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {SECTION_LABELS[section as keyof typeof SECTION_LABELS]}
                  </span>
                </div>
                <span className="text-[10px] font-bold">{percentage}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(percentage)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Specific AI Triggers per section */}
              {percentage < 100 && (
                <div className="grid grid-cols-1 gap-1 pt-1">
                  {section === 'content' && (
                    <>
                      {isFieldMissing('definition_positive') && (
                        <button 
                          onClick={() => onGenerateField?.('definition_positive')}
                          className="flex items-center gap-1 text-[9px] text-primary hover:underline font-medium leading-tight"
                        >
                          <Sparkles className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Definition</span><span className="sm:hidden">Def</span>
                        </button>
                      )}
                      {isFieldMissing('article') && (
                        <button 
                          onClick={() => onGenerateField?.('article')}
                          className="flex items-center gap-1 text-[9px] text-primary hover:underline font-medium leading-tight"
                        >
                          <Sparkles className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Article</span><span className="sm:hidden">Art</span>
                        </button>
                      )}
                      {isFieldMissing('practical_takeaways') && (
                        <button 
                          onClick={() => onGenerateField?.('practical_takeaways')}
                          className="flex items-center gap-1 text-[9px] text-primary hover:underline font-medium leading-tight"
                        >
                          <Sparkles className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Takeaways</span><span className="sm:hidden">Tips</span>
                        </button>
                      )}
                    </>
                  )}
                  {section === 'relationships' && percentage < 100 && (
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('ai-find-relationships'))}
                      className="flex items-center gap-1 text-[9px] text-primary hover:underline font-medium leading-tight"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Find Topics</span><span className="sm:hidden">Topics</span>
                    </button>
                  )}
                  {section === 'sources' && percentage < 100 && (
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('ai-suggest-citations'))}
                      className="flex items-center gap-1 text-[9px] text-primary hover:underline font-medium leading-tight"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Sources</span><span className="sm:hidden">Src</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Proactive Suggestions */}
      {completeness.suggestions.length > 0 && (
        <div className="dashboard-card p-3 bg-primary/5 border-primary/10">
          <div className="flex items-center gap-1.5 mb-2 text-primary">
            <Sparkles className="w-3 h-3" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">AI Insights</h4>
          </div>
          <ul className="space-y-2">
            {completeness.suggestions.slice(0, 2).map((suggestion, index) => (
              <li key={index} className="text-[10px] leading-tight text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                {suggestion}
              </li>
            ))}
          </ul>
          {completeness.suggestions.length > 2 && (
            <p className="text-[9px] text-muted-foreground mt-1">
              +{completeness.suggestions.length - 2} more suggestions
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicCompleteness;
