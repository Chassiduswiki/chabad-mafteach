/**
 * Smart Search Mode - Automatically determines the best search strategy
 */

import { isHebrew } from '@/lib/utils/search';
import { log } from '@/lib/logger';

export interface SmartSearchConfig {
  mode: 'keyword' | 'semantic' | 'hybrid';
  confidence: number;
  reasoning: string;
  fallbackUsed: boolean;
}

/**
 * Determine the optimal search mode based on query and system state
 */
export function determineSmartSearchMode(query: string): SmartSearchConfig {
  const trimmedQuery = query.trim();
  
  // 1. Basic validation
  if (!trimmedQuery || trimmedQuery.length < 1) {
    return {
      mode: 'keyword',
      confidence: 1.0,
      reasoning: 'Empty query - using keyword search',
      fallbackUsed: false
    };
  }

  // 2. Query analysis
  const isHebrewQuery = isHebrew(trimmedQuery);
  const queryLength = trimmedQuery.length;
  const hasMultipleWords = trimmedQuery.includes(' ') || trimmedQuery.includes('\u05F5'); // Hebrew space
  
  // 3. System capability checks
  const aiAvailable = checkAIAvailability();
  const embeddingsAvailable = checkEmbeddingAvailability();
  
  // 4. Smart mode selection logic
  if (!aiAvailable || !embeddingsAvailable) {
    log.search(trimmedQuery, 'keyword', 0, 0, {
      reasoning: 'AI/embeddings unavailable, defaulting to keyword',
      isHebrew: isHebrewQuery,
      aiAvailable,
      embeddingsAvailable
    });
    
    return {
      mode: 'keyword',
      confidence: 0.9,
      reasoning: 'AI services unavailable - using keyword search',
      fallbackUsed: true
    };
  }

  // 5. Language-specific optimization
  if (isHebrewQuery) {
    // Hebrew queries work best with keyword search on Hebrew titles
    if (queryLength <= 10) {
      // Short Hebrew queries - keyword is very effective
      return {
        mode: 'keyword',
        confidence: 0.95,
        reasoning: 'Short Hebrew query - keyword search on Hebrew titles',
        fallbackUsed: false
      };
    } else {
      // Longer Hebrew queries - try semantic for conceptual matches
      return {
        mode: 'semantic',
        confidence: 0.8,
        reasoning: 'Longer Hebrew query - trying semantic for conceptual matches',
        fallbackUsed: false
      };
    }
  }

  // 6. English query optimization
  if (!isHebrewQuery) {
    if (hasMultipleWords) {
      // Multi-word English queries - semantic search excels
      return {
        mode: 'semantic',
        confidence: 0.85,
        reasoning: 'Multi-word English query - semantic search for conceptual understanding',
        fallbackUsed: false
      };
    } else {
      // Single English word - hybrid to get both exact and conceptual matches
      return {
        mode: 'hybrid',
        confidence: 0.8,
        reasoning: 'Single English word - hybrid for exact + conceptual matches',
        fallbackUsed: false
      };
    }
  }

  // 7. Default fallback
  return {
    mode: 'keyword',
    confidence: 0.7,
    reasoning: 'Default fallback to keyword search',
    fallbackUsed: false
  };
}

/**
 * Check if AI services are available
 */
function checkAIAvailability(): boolean {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  
  return !!(apiKey && model && apiKey.startsWith('sk-'));
}

/**
 * Check if embedding data is available
 */
function checkEmbeddingAvailability(): boolean {
  // In a real implementation, this would check if vector embeddings exist
  // For now, we'll assume they're available if AI is available
  return checkAIAvailability();
}

/**
 * Get optimized search filters based on query language
 */
export function getLanguageOptimizedFilters(query: string): Record<string, any> {
  const isHebrewQuery = isHebrew(query);
  
  if (isHebrewQuery) {
    // Hebrew queries - prioritize Hebrew fields
    return {
      _or: [
        { name_hebrew: { _icontains: query } },
        { name: { _icontains: query } }, // English name fallback
        { definition_short: { _icontains: query } }
      ]
    };
  } else {
    // English queries - prioritize English fields and transliterations
    return {
      _or: [
        { name: { _icontains: query } },
        { name_hebrew: { _icontains: query } }, // Hebrew fallback
        { definition_short: { _icontains: query } }
      ]
    };
  }
}

/**
 * Get search result explanation for UI
 */
export function getSearchExplanation(config: SmartSearchConfig, query: string): string {
  const { mode, confidence, reasoning, fallbackUsed } = config;
  
  let explanation = '';
  
  if (fallbackUsed) {
    explanation = `Using keyword search (AI unavailable)`;
  } else {
    switch (mode) {
      case 'keyword':
        explanation = `Exact match search`;
        break;
      case 'semantic':
        explanation = `Conceptual search`;
        break;
      case 'hybrid':
        explanation = `Combined exact + conceptual search`;
        break;
    }
  }
  
  // Add language context
  const isHebrewQuery = isHebrew(query);
  if (isHebrewQuery) {
    explanation += ` (Hebrew content)`;
  } else {
    explanation += ` (English content)`;
  }
  
  return explanation;
}

/**
 * Determine if search should show semantic indicators
 */
export function shouldShowSemanticIndicators(config: SmartSearchConfig): boolean {
  return config.mode === 'semantic' || config.mode === 'hybrid';
}
