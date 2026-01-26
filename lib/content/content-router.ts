/**
 * Ingestion Engine - Smart Content Router
 * 
 * Logic:
 * 1. Analyze parsed statements and metadata to determine content type.
 * 2. Routing rules:
 *    - Biography: Contains years, birth/death indicators, or "Rabbi", "Rebbe", "Author".
 *    - Topic Description: Concise, definitional, often starts with "X is...".
 *    - Article: Long-form, multiple sections, high statement count.
 *    - Reference: Primarily citations and source pointers.
 */

import { ParsedStatement } from './ingestion-parser';

export type RoutedContentType = 'bio' | 'topic_def' | 'article' | 'reference' | 'unknown';

export interface RoutingDecision {
  type: RoutedContentType;
  confidence: number;
  reasoning: string;
}

export function routeContent(
  heading: string,
  statements: ParsedStatement[],
  metadata: any = {}
): RoutingDecision {
  const textContent = statements.map(s => s.text).join(' ');
  const statementCount = statements.length;

  // 1. Detect Biography
  const bioKeywords = ['born', 'died', 'rabbi', 'rebbe', 'author', 'lived', 'century', 'dynasty'];
  const hasYears = /\b(1\d{3}|20\d{2})\b/.test(textContent);
  const bioScore = bioKeywords.filter(k => textContent.toLowerCase().includes(k)).length + (hasYears ? 3 : 0);

  if (bioScore >= 4 || (hasYears && heading.toLowerCase().includes('rabbi'))) {
    return {
      type: 'bio',
      confidence: Math.min(0.9, 0.5 + (bioScore * 0.1)),
      reasoning: `Found bio keywords (${bioKeywords.filter(k => textContent.toLowerCase().includes(k)).join(', ')}) and temporal indicators.`
    };
  }

  // 2. Detect Article (Long-form)
  if (statementCount > 15 || heading.toLowerCase().includes('essay') || heading.toLowerCase().includes('treatise')) {
    return {
      type: 'article',
      confidence: Math.min(0.95, 0.4 + (statementCount * 0.02)),
      reasoning: `High statement count (${statementCount}) and structural indicators.`
    };
  }

  // 3. Detect Reference/Bibliography
  const refKeywords = ['source', 'reference', 'citation', 'bibliography', 'see also', 'cf.'];
  const refScore = refKeywords.filter(k => heading.toLowerCase().includes(k)).length;
  if (refScore >= 1 || statements.every(s => s.type === 'footnote' || s.type === 'citation')) {
    return {
      type: 'reference',
      confidence: 0.85,
      reasoning: `Heading contains reference keywords or all statements are citations.`
    };
  }

  // 4. Default to Topic Definition
  return {
    type: 'topic_def',
    confidence: 0.7,
    reasoning: `Concise content, defaulting to topic definition.`
  };
}
