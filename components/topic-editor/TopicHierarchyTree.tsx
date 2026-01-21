'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Circle, ArrowRight, Link2 } from 'lucide-react';
import { Topic, TopicRelationship } from '@/lib/types';

interface TopicNode {
  id: number;
  title: string;
  slug: string;
  type?: string;
  children: TopicNode[];
  relationshipType?: string;
  isCurrentTopic?: boolean;
}

interface TopicHierarchyTreeProps {
  currentTopicId: number;
  relationships: TopicRelationship[];
  onTopicClick?: (topicId: number, slug: string) => void;
}

export const TopicHierarchyTree: React.FC<TopicHierarchyTreeProps> = ({
  currentTopicId,
  relationships,
  onTopicClick,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [hierarchyData, setHierarchyData] = useState<{
    ancestors: TopicNode[];
    currentTopic: TopicNode | null;
    children: TopicNode[];
    related: TopicNode[];
  }>({
    ancestors: [],
    currentTopic: null,
    children: [],
    related: [],
  });

  useEffect(() => {
    buildHierarchy();
  }, [currentTopicId, relationships]);

  const buildHierarchy = () => {
    // Find parent relationships (where current topic is the child)
    const parentRelationships = relationships.filter(
      (r) => r.child_topic_id === currentTopicId || (r as any).childTopic?.id === currentTopicId
    );

    // Find child relationships (where current topic is the parent)
    const childRelationships = relationships.filter(
      (r) => r.parent_topic_id === currentTopicId || (r as any).parentTopic?.id === currentTopicId
    );

    // Build ancestor nodes (parents of current topic)
    const ancestors: TopicNode[] = parentRelationships.map((rel) => {
      const parentTopic = (rel as any).parentTopic || {
        id: rel.parent_topic_id,
        canonical_title: `Topic ${rel.parent_topic_id}`,
        slug: String(rel.parent_topic_id),
      };
      return {
        id: parentTopic.id,
        title: parentTopic.canonical_title,
        slug: parentTopic.slug || String(parentTopic.id),
        type: parentTopic.topic_type,
        children: [],
        relationshipType: rel.relation_type,
      };
    });

    // Build child nodes (children of current topic)
    const children: TopicNode[] = childRelationships
      .filter((rel) => ['subcategory', 'instance_of', 'part_of', 'conceptual_parent'].includes(rel.relation_type || ''))
      .map((rel) => {
        const childTopic = (rel as any).childTopic || {
          id: rel.child_topic_id,
          canonical_title: `Topic ${rel.child_topic_id}`,
          slug: String(rel.child_topic_id),
        };
        return {
          id: childTopic.id,
          title: childTopic.canonical_title,
          slug: childTopic.slug || String(childTopic.id),
          type: childTopic.topic_type,
          children: [],
          relationshipType: rel.relation_type,
        };
      });

    // Build related nodes (non-hierarchical relationships)
    const related: TopicNode[] = childRelationships
      .filter((rel) => !['subcategory', 'instance_of', 'part_of', 'conceptual_parent'].includes(rel.relation_type || ''))
      .map((rel) => {
        const childTopic = (rel as any).childTopic || {
          id: rel.child_topic_id,
          canonical_title: `Topic ${rel.child_topic_id}`,
          slug: String(rel.child_topic_id),
        };
        return {
          id: childTopic.id,
          title: childTopic.canonical_title,
          slug: childTopic.slug || String(childTopic.id),
          type: childTopic.topic_type,
          children: [],
          relationshipType: rel.relation_type,
        };
      });

    setHierarchyData({
      ancestors,
      currentTopic: {
        id: currentTopicId,
        title: 'Current Topic',
        slug: String(currentTopicId),
        children: [],
        isCurrentTopic: true,
      },
      children,
      related,
    });

    // Auto-expand current level
    setExpandedNodes(new Set([currentTopicId]));
  };

  const toggleExpand = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleTopicClick = (node: TopicNode) => {
    if (onTopicClick && !node.isCurrentTopic) {
      onTopicClick(node.id, node.slug);
    }
  };

  const renderNode = (node: TopicNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors ${
            node.isCurrentTopic
              ? 'bg-primary/10 text-primary font-medium'
              : 'hover:bg-muted cursor-pointer'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => !node.isCurrentTopic && handleTopicClick(node)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <Circle className="h-2 w-2 text-muted-foreground ml-1 mr-1" />
          )}

          <span className={`text-sm ${node.isCurrentTopic ? 'font-medium' : ''}`}>
            {node.title}
          </span>

          {node.relationshipType && !node.isCurrentTopic && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">
              {node.relationshipType.replace('_', ' ')}
            </span>
          )}

          {node.type && (
            <span className="text-xs text-muted-foreground">
              ({node.type})
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const isEmpty = 
    hierarchyData.ancestors.length === 0 && 
    hierarchyData.children.length === 0 && 
    hierarchyData.related.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No relationships defined yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ancestors (Parent Topics) */}
      {hierarchyData.ancestors.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3 rotate-180" />
            Parent Topics
          </h4>
          <div className="border border-border rounded-lg p-2">
            {hierarchyData.ancestors.map((node) => renderNode(node))}
          </div>
        </div>
      )}

      {/* Current Topic Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground px-2 bg-background">
          Current Topic
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Children (Child Topics) */}
      {hierarchyData.children.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Child Topics ({hierarchyData.children.length})
          </h4>
          <div className="border border-border rounded-lg p-2">
            {hierarchyData.children.map((node) => renderNode(node))}
          </div>
        </div>
      )}

      {/* Related Topics */}
      {hierarchyData.related.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            Related Topics ({hierarchyData.related.length})
          </h4>
          <div className="border border-border rounded-lg p-2">
            {hierarchyData.related.map((node) => renderNode(node))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicHierarchyTree;
