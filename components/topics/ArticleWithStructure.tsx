'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Quote, Link2, AlertCircle } from 'lucide-react';
import { MarkdownContent } from '@/components/shared/MarkdownContent';

interface ContentBlock {
  id: number;
  order_key: string;
  content: string;
  block_type: 'heading' | 'subheading' | 'paragraph' | 'section break';
  metadata?: Record<string, any>;
  order_position: number;
}

interface Statement {
  id: number;
  text: string;
  importance_score: number;
  block_id: number;
  metadata?: Record<string, any>;
}

interface Source {
  id: number;
  title: string;
  external_system?: string;
  external_url?: string;
  metadata?: Record<string, any>;
}

interface SourceLink {
  id: number;
  statement_id: number;
  source_id: number;
  relationship_type: string;
  confidence_level: string;
  notes?: string;
}

interface ArticleWithStructureProps {
  topicId: number;
  topicTitle: string;
}

export function ArticleWithStructure({ topicId, topicTitle }: ArticleWithStructureProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceLinks, setSourceLinks] = useState<SourceLink[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set([0]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch documents for this topic
        const docsRes = await fetch(`/api/documents?topic_id=${topicId}`);
        if (!docsRes.ok) throw new Error('Failed to fetch documents');
        const docsData = await docsRes.json();
        const documentId = docsData.data?.[0]?.id;

        if (!documentId) {
          setError('No document found for this topic');
          setLoading(false);
          return;
        }

        // Fetch content blocks
        const blocksRes = await fetch(`/api/content-blocks?doc_id=${documentId}`);
        if (!blocksRes.ok) throw new Error('Failed to fetch content blocks');
        const blocksData = await blocksRes.json();
        setBlocks(blocksData.data || []);

        // Fetch statements
        const stmtsRes = await fetch(`/api/statements?doc_id=${documentId}`);
        if (!stmtsRes.ok) throw new Error('Failed to fetch statements');
        const stmtsData = await stmtsRes.json();
        setStatements(stmtsData.data || []);

        // Fetch sources
        const srcRes = await fetch(`/api/sources?topic_id=${topicId}`);
        if (!srcRes.ok) throw new Error('Failed to fetch sources');
        const srcData = await srcRes.json();
        setSources(srcData.data || []);

        // Fetch source links
        const linksRes = await fetch(`/api/source-links?topic_id=${topicId}`);
        if (!linksRes.ok) throw new Error('Failed to fetch source links');
        const linksData = await linksRes.json();
        setSourceLinks(linksData.data || []);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [topicId]);

  const toggleBlock = (blockId: number) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const getSourcesForStatement = (statementId: number): Source[] => {
    const links = sourceLinks.filter(l => l.statement_id === statementId);
    return links
      .map(link => sources.find(s => s.id === link.source_id))
      .filter((s): s is Source => !!s);
  };

  const getSourceLink = (statementId: number): SourceLink | undefined => {
    return sourceLinks.find(l => l.statement_id === statementId);
  };

  const getSectionLabel = (orderKey: string): string => {
    if (orderKey.includes('definition')) return 'Definition';
    if (orderKey.includes('mashal')) return 'Mashal (Parable)';
    if (orderKey.includes('personal_nimshal')) return 'Personal Application';
    if (orderKey.includes('global_nimshal')) return 'Global Meaning';
    if (orderKey.includes('sources')) return 'Sources';
    return 'Section';
  };

  const getImportanceColor = (score: number): string => {
    if (score >= 0.85) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
    if (score >= 0.70) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
    return 'bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600';
  };

  const getConfidenceLabel = (level: string): string => {
    const labels: Record<string, string> = {
      high: '🟢 High',
      medium: '🟡 Medium',
      low: '🔴 Low',
      verified: '✓ Verified',
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-destructive">Error Loading Article</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No article content available for this topic.</p>
      </div>
    );
  }

  return (
    <article className="space-y-4">
      {/* Article Header */}
      <div className="mb-8 pb-6 border-b">
        <h2 className="text-2xl font-bold mb-2">{topicTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {blocks.length} sections • {statements.length} key points • {sources.length} sources
        </p>
      </div>

      {/* Content Blocks with Statements */}
      <div className="space-y-4">
        {blocks.map((block: ContentBlock, idx: number) => {
          const isExpanded = expandedBlocks.has(block.id);
          const blockStatements = statements.filter(s => s.block_id === block.id);
          const sectionLabel = getSectionLabel(block.order_key);

          return (
            <div key={block.id} className="border rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full px-4 py-3 bg-muted/50 hover:bg-muted/80 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3 text-left">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-foreground">{sectionLabel}</h3>
                    <p className="text-xs text-muted-foreground">
                      {blockStatements.length} key points
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-4 space-y-4 bg-background">
                  {/* Content Block Text */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownContent content={block.content} />
                  </div>

                  {/* Statements */}
                  {blockStatements.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground">Key Points</h4>
                      {blockStatements
                        .sort((a: Statement, b: Statement) => b.importance_score - a.importance_score)
                        .map((stmt: Statement) => {
                          const sources = getSourcesForStatement(stmt.id);
                          const link = getSourceLink(stmt.id);
                          const importance = stmt.importance_score;

                          return (
                            <div
                              key={stmt.id}
                              className={`rounded-lg border p-3 space-y-2 ${getImportanceColor(importance)}`}
                            >
                              {/* Statement Text */}
                              <div className="flex gap-2">
                                <Quote className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />
                                <p className="text-sm leading-relaxed">{stmt.text}</p>
                              </div>

                              {/* Importance Score */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-block px-2 py-1 rounded bg-background/50">
                                  Importance: {(importance * 100).toFixed(0)}%
                                </span>
                              </div>

                              {/* Sources */}
                              {sources.length > 0 && (
                                <div className="space-y-1 pt-2 border-t">
                                  <p className="text-xs font-semibold text-muted-foreground">Sources:</p>
                                  {sources.map(src => (
                                    <div key={src.id} className="text-xs space-y-1">
                                      <div className="flex items-start gap-2">
                                        <Link2 className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-60" />
                                        <div>
                                          <p className="font-medium">{src.title}</p>
                                          {link && (
                                            <div className="flex gap-2 mt-1">
                                              <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-background/50">
                                                {link.relationship_type}
                                              </span>
                                              <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-background/50">
                                                {getConfidenceLabel(link.confidence_level)}
                                              </span>
                                            </div>
                                          )}
                                          {link?.notes && (
                                            <p className="text-xs text-muted-foreground mt-1 italic">
                                              {link.notes}
                                            </p>
                                          )}
                                          {src.external_url && (
                                            <a
                                              href={src.external_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                                            >
                                              View Source →
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All Sources Reference */}
      {sources.length > 0 && (
        <div className="mt-8 pt-6 border-t space-y-4">
          <h3 className="text-lg font-semibold">All Sources</h3>
          <div className="grid gap-3">
            {sources.map(src => (
              <div key={src.id} className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{src.title}</p>
                    {src.external_system && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {src.external_system}
                      </p>
                    )}
                  </div>
                  {src.external_url && (
                    <a
                      href={src.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                    >
                      Open →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
