'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Circle, TrendingUp } from 'lucide-react';
import { TopicCompleteness as CompletenessType, TopicFormData } from './types';

interface TopicCompletenessProps {
  formData: TopicFormData;
  relationshipCount?: number;
  sourceCount?: number;
  className?: string;
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
        if (config.section === 'content' && strValue.length < 100) {
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

    const overall = Math.round((achievedWeight / totalWeight) * 100);

    return {
      overall,
      sections,
      missingFields,
      suggestions: suggestions.slice(0, 3), // Top 3 suggestions
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Content Completeness</h3>
          </div>
          <span className={`text-2xl font-bold ${
            completeness.overall >= 80 ? 'text-green-500' :
            completeness.overall >= 50 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {completeness.overall}%
          </span>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(completeness.overall)}`}
            style={{ width: `${completeness.overall}%` }}
          />
        </div>

        {/* Section Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(completeness.sections).map(([section, percentage]) => (
            <div key={section} className="flex items-center gap-2">
              {getStatusIcon(percentage)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground truncate">
                    {SECTION_LABELS[section as keyof typeof SECTION_LABELS]}
                  </span>
                  <span className="text-xs font-medium">{percentage}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {completeness.suggestions.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Suggestions</h4>
          <ul className="space-y-2">
            {completeness.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Fields */}
      {completeness.missingFields.length > 0 && completeness.overall < 100 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Missing: </span>
          {completeness.missingFields.slice(0, 5).join(', ')}
          {completeness.missingFields.length > 5 && ` +${completeness.missingFields.length - 5} more`}
        </div>
      )}
    </div>
  );
};

export default TopicCompleteness;
