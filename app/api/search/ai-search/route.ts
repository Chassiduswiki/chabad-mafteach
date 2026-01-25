import { NextRequest, NextResponse } from 'next/server';
import { readItems } from '@directus/sdk';
import { createClient } from '@/lib/directus';

const directus = createClient();

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {}, limit = 20, offset = 0 } = await request.json();

    // Validate input
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Build search terms for partial matching
    const searchTerms = query.toLowerCase().split(' ').filter((term: string) => term.length > 2);
    
    // Search across multiple content fields with relevance scoring
    const searchQuery = {
      _or: [
        // Topic content fields
        { 'canonical_title': { _icontains: query } },
        { 'canonical_title_en': { _icontains: query } },
        { 'canonical_title_transliteration': { _icontains: query } },
        { 'description': { _icontains: query } },
        { 'definition_positive': { _icontains: query } },
        { 'definition_negative': { _icontains: query } },
        { 'overview': { _icontains: query } },
        { 'article': { _icontains: query } },
        { 'practical_takeaways': { _icontains: query } },
        { 'historical_context': { _icontains: query } },
        { 'mashal': { _icontains: query } },
        { 'global_nimshal': { _icontains: query } },
        // Topic metadata
        { 'topic_type': { _icontains: query } },
        { 'content_status': { _icontains: query } },
        { 'status_label': { _icontains: query } },
        { 'badge_color': { _icontains: query } },
      ],
      // Apply additional filters
      ...filters,
      // Only published topics
      'status': { _eq: 'published' },
    };

    // Query topics with AI-enhanced sorting
    const topics = await directus.request(
      readItems('topics', {
        fields: [
          'id', 'canonical_title', 'canonical_title_en', 'canonical_title_transliteration',
          'slug', 'topic_type', 'description', 'content_status', 'status_label', 'badge_color',
          'definition_positive', 'definition_negative', 'overview', 'article',
          'practical_takeaways', 'historical_context', 'mashal', 'global_nimshal', 'charts',
          'date_created', 'date_updated',
        ],
        filter: searchQuery,
        limit: limit,
        offset: offset,
        sort: ['-date_updated', 'canonical_title'],
      })
    ) as any[];

    // Calculate AI relevance scores
    const enhancedResults = topics.map(topic => {
      const queryLower = query.toLowerCase();
      let score = 0;
      
      // Title matches (highest weight)
      if (topic.canonical_title && topic.canonical_title.toLowerCase().includes(queryLower)) {
        score += 50;
      }
      if (topic.canonical_title_en && topic.canonical_title_en.toLowerCase().includes(queryLower)) {
        score += 40;
      }
      
      // Content matches (medium weight)
      const contentFields = [
        topic.description, topic.definition_positive, topic.definition_negative,
        topic.overview, topic.article, topic.practical_takeaways,
        topic.historical_context, topic.mashal, topic.global_nimshal
      ];
      
      contentFields.forEach((field: string | null) => {
        if (field && typeof field === 'string' && field.toLowerCase().includes(queryLower)) {
          score += 20;
        }
      });
      
      if (topic.topic_type && topic.topic_type.toLowerCase().includes(queryLower)) {
        score += 15;
      }
      
      // Partial matches (lower weight)
      searchTerms.forEach((term: string) => {
        if (topic.canonical_title && topic.canonical_title.toLowerCase().includes(term)) {
          score += 10;
        }
        if (topic.canonical_title_en && topic.canonical_title_en.toLowerCase().includes(term)) {
          score += 8;
        }
      });
      
      // Boost recently updated content
      const daysSinceUpdate = topic.date_updated ? 
        Math.floor((Date.now() - new Date(topic.date_updated).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      if (daysSinceUpdate < 30) {
        score += Math.max(0, 10 - daysSinceUpdate / 3);
      }
      
      return {
        ...topic,
        _relevanceScore: score,
        _searchHighlights: generateHighlights(topic, query),
      };
    }).sort((a, b) => b._relevanceScore - a._relevanceScore);

    return NextResponse.json({
      results: enhancedResults,
      total: enhancedResults.length,
      query,
      suggestions: generateSuggestions(query, topics),
      hasMore: enhancedResults.length === limit,
    });
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

function generateHighlights(topic: any, query: string): string[] {
  const highlights: string[] = [];
  const queryLower = query.toLowerCase();
  
  const fields = [
    'canonical_title', 'canonical_title_en', 'description', 
    'definition_positive', 'overview', 'article', 'practical_takeaways'
  ];
  
  fields.forEach(field => {
    const value = topic[field];
    if (value && typeof value === 'string') {
      const index = value.toLowerCase().indexOf(queryLower);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(value.length, index + query.length + 50);
        highlights.push(value.substring(start, end));
      }
    }
  });
  
  return highlights;
}

function generateSuggestions(query: string, topics: any[]): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Extract unique topic types
  const topicTypes = [...new Set(topics.map(t => t.topic_type).filter(Boolean))];
  
  // Suggest topic types if query matches
  topicTypes.forEach(type => {
    if (type && type.toLowerCase().includes(queryLower)) {
      suggestions.push(`Type: ${type}`);
    }
  });
  
  // Suggest related topics based on content
  const relatedTopics = topics
    .filter(t => 
      t.canonical_title && 
      t.canonical_title.toLowerCase() !== queryLower &&
      (t.description?.toLowerCase().includes(queryLower) || 
       t.overview?.toLowerCase().includes(queryLower))
    )
    .slice(0, 3)
    .map(t => t.canonical_title);
  
  suggestions.push(...relatedTopics);
  
  return [...new Set(suggestions)].slice(0, 5);
}
