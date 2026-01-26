'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ForceGraph, GraphNode, GraphEdge } from './ForceGraph';
import { 
  SEFIROS_LAYOUT, 
  SEFIROS_CONNECTIONS, 
  toForceGraphNodes, 
  toForceGraphEdges, 
  SefirahPosition 
} from './SefirosLayout';

interface SefirosGraphProps {
  width?: number;
  height?: number;
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
  highlightedNodeId?: string;
  interactive?: boolean;
}

/**
 * SefirosGraph - Specialized graph for the Ten Sefiros
 * 
 * Features:
 * - Traditional three-pillar layout
 * - Fixed positioning based on Kabbalistic arrangement
 * - Special colors and styling for each Sefirah
 * - Pillar indicators and labels
 * - Enhanced visual hierarchy
 */
export function SefirosGraph({
  width = 800,
  height = 550,
  className,
  onNodeClick,
  highlightedNodeId,
  interactive = true,
}: SefirosGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Convert our layout to ForceGraph format
  const nodes = toForceGraphNodes();
  const edges = toForceGraphEdges();

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    } else if (node.slug) {
      router.push(`/topics/${node.slug}`);
    }
  }, [onNodeClick, router]);

  // Custom node styling based on Sefirah properties
  const getSefirahStyle = useCallback((node: GraphNode) => {
    const sefirah = SEFIROS_LAYOUT.find(s => s.id === node.id);
    if (!sefirah) return {};

    return {
      fill: sefirah.color,
      stroke: hoveredNode === node.id ? '#fff' : '#fff',
      strokeWidth: hoveredNode === node.id ? 4 : 2,
      filter: node.id === highlightedNodeId ? 'url(#glow)' : null,
    };
  }, [hoveredNode, highlightedNodeId]);


  // Custom rendering to override ForceGraph defaults
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create container group
    const container = svg.append('g');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    if (interactive) {
      svg.call(zoom);
    }


    // Draw edges with custom styling
    const links = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('x1', (d: any) => {
        const sourceNode = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
        return sourceNode?.x || 0;
      })
      .attr('y1', (d: any) => {
        const sourceNode = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
        return sourceNode?.y || 0;
      })
      .attr('x2', (d: any) => {
        const targetNode = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
        return targetNode?.x || 0;
      })
      .attr('y2', (d: any) => {
        const targetNode = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
        return targetNode?.y || 0;
      })
      .attr('stroke', '#9ca3af')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2);

    // Draw nodes
    const nodeGroup = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on('mouseenter', (event, d) => setHoveredNode(d.id))
      .on('mouseleave', () => setHoveredNode(null));

    // Node circles with custom colors
    nodeGroup.append('circle')
      .attr('r', 35)
      .attr('fill', (d: any) => getSefirahStyle(d).fill || '#6b7280')
      .attr('stroke', (d: any) => getSefirahStyle(d).stroke || '#fff')
      .attr('stroke-width', (d: any) => getSefirahStyle(d).strokeWidth || 3)
      .attr('filter', (d: any) => getSefirahStyle(d).filter || null);

    // Node labels (Hebrew primary, larger and more prominent)
    nodeGroup.append('text')
      .attr('x', 0)
      .attr('y', 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', '700')
      .attr('fill', '#1f2937')
      .attr('class', 'pointer-events-none select-none')
      .text(d => d.labelHebrew || d.label);

    // English labels below nodes
    nodeGroup.append('text')
      .attr('x', 0)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#6b7280')
      .attr('class', 'pointer-events-none select-none')
      .text(d => {
        const sefirah = SEFIROS_LAYOUT.find(s => s.id === d.id);
        return sefirah?.english || '';
      });

    // Add glow filter for highlighted nodes
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Update hover states
    const updateHoverStyles = () => {
      nodeGroup.select('circle')
        .attr('stroke-width', d => d.id === hoveredNode ? 4 : 2)
        .attr('filter', d => d.id === hoveredNode || d.id === highlightedNodeId ? 'url(#glow)' : null);
      
      links
        .attr('stroke-opacity', (d: any) => {
          if (!hoveredNode) return 0.6;
          const source = typeof d.source === 'string' ? d.source : d.source.id;
          const target = typeof d.target === 'string' ? d.target : d.target.id;
          return source === hoveredNode || target === hoveredNode ? 0.8 : 0.2;
        });
    };

    updateHoverStyles();

  }, [nodes, edges, width, height, handleNodeClick, highlightedNodeId, interactive, getSefirahStyle, hoveredNode]);

  if (nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground', className)} style={{ width, height }}>
        <p className="text-sm">Sefiros data not available</p>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-background border border-border', className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-auto"
        style={{ maxHeight: height }}
      />
      

      {/* Instructions */}
      {interactive && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border/50">
          Click Sefiros to explore • Scroll to zoom
        </div>
      )}

    </div>
  );
}

export default SefirosGraph;
