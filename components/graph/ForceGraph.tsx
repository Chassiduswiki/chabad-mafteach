'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface GraphNode {
    id: string;
    label: string;
    labelHebrew?: string;
    slug: string;
    category?: string;
    size?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface GraphEdge {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    strength: number;
    description?: string;
}

interface ForceGraphProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    width?: number;
    height?: number;
    className?: string;
    onNodeClick?: (node: GraphNode) => void;
    highlightedNodeId?: string;
    interactive?: boolean;
}

const categoryColors: Record<string, string> = {
    concept: '#8b5cf6',      // Purple
    person: '#3b82f6',       // Blue
    mitzvah: '#10b981',      // Emerald
    sefirah: '#f59e0b',      // Amber
    place: '#ec4899',        // Pink
    event: '#ef4444',        // Red
    default: '#6b7280',      // Gray
};

/**
 * ForceGraph - Interactive physics-based graph visualization
 * 
 * Features:
 * - Draggable nodes with physics simulation
 * - Bouncy/springy interactions like Obsidian
 * - Click to navigate to topics
 * - Zoom and pan support
 */
export function ForceGraph({
    nodes,
    edges,
    width = 600,
    height = 400,
    className,
    onNodeClick,
    highlightedNodeId,
    interactive = true,
}: ForceGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
    const router = useRouter();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Detect mobile device and handle resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleNodeClick = useCallback((node: GraphNode) => {
        if (onNodeClick) {
            onNodeClick(node);
        } else if (node.slug) {
            router.push(`/topics/${node.slug}`);
        }
    }, [onNodeClick, router]);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Create container group for zoom/pan
        const container = svg.append('g');

        // Setup zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                container.attr('transform', event.transform);
            });

        if (interactive && (!isMobile || isInteracting)) {
            svg.call(zoom);
        }

        // Create a copy of nodes and edges for the simulation
        const simNodes: GraphNode[] = nodes.map(n => ({ ...n }));
        const simEdges: GraphEdge[] = edges.map(e => ({ ...e }));

        // Create the simulation with bouncy physics
        const simulation = d3.forceSimulation<GraphNode>(simNodes)
            .force('link', d3.forceLink<GraphNode, GraphEdge>(simEdges)
                .id(d => d.id)
                .distance(80)
                .strength(0.5))
            .force('charge', d3.forceManyBody()
                .strength(-200)
                .distanceMax(300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30))
            .alphaDecay(0.02)
            .velocityDecay(0.3); // Lower = more bouncy

        simulationRef.current = simulation;

        // Run simulation for a bit to stabilize before rendering
        // This ensures nodes are centered and not randomly positioned
        for (let i = 0; i < 100; i++) {
            simulation.tick();
        }

        // Calculate bounding box of all nodes
        const getBounds = () => {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            simNodes.forEach(node => {
                const x = node.x || 0;
                const y = node.y || 0;
                const r = 8 + (node.size || 1) * 2;
                minX = Math.min(minX, x - r);
                maxX = Math.max(maxX, x + r);
                minY = Math.min(minY, y - r);
                maxY = Math.max(maxY, y + r);
            });
            return { minX, maxX, minY, maxY };
        };

        const bounds = getBounds();
        const nodeWidth = bounds.maxX - bounds.minX;
        const nodeHeight = bounds.maxY - bounds.minY;
        
        // Calculate zoom level to fit all nodes with padding
        const padding = 40;
        const scale = Math.min(
            (width - padding * 2) / nodeWidth,
            (height - padding * 2) / nodeHeight,
            3 // Max zoom
        );
        
        // Calculate translation to center nodes
        const tx = (width - nodeWidth * scale) / 2 - bounds.minX * scale;
        const ty = (height - nodeHeight * scale) / 2 - bounds.minY * scale;

        // Apply initial zoom/pan to center and fit
        svg.call(zoom.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));

        // Draw edges
        const links = container.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(simEdges)
            .enter()
            .append('line')
            .attr('stroke', '#e5e7eb')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.max(1, (d.strength || 50) / 30));

        // Draw nodes
        const nodeGroup = container.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(simNodes)
            .enter()
            .append('g')
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                handleNodeClick(d);
            })
            .on('mouseenter', (event, d) => setHoveredNode(d.id))
            .on('mouseleave', () => setHoveredNode(null));

        // Add drag behavior
        if (interactive) {
            nodeGroup.call(d3.drag<SVGGElement, GraphNode>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    // Release node to float free (bouncy behavior)
                    d.fx = null;
                    d.fy = null;
                }));
        }

        // Node circles
        nodeGroup.append('circle')
            .attr('r', d => 8 + (d.size || 1) * 2)
            .attr('fill', d => categoryColors[d.category || 'default'] || categoryColors.default)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('filter', d => d.id === highlightedNodeId ? 'url(#glow)' : null);

        // Node labels
        nodeGroup.append('text')
            .text(d => d.label)
            .attr('x', 0)
            .attr('y', d => 16 + (d.size || 1) * 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', '500')
            .attr('fill', 'currentColor')
            .attr('class', 'pointer-events-none select-none');

        // Add glow filter for highlighted nodes
        const defs = svg.append('defs');
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');
        
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Update positions on tick
        simulation.on('tick', () => {
            links
                .attr('x1', d => (d.source as GraphNode).x || 0)
                .attr('y1', d => (d.source as GraphNode).y || 0)
                .attr('x2', d => (d.target as GraphNode).x || 0)
                .attr('y2', d => (d.target as GraphNode).y || 0);

            nodeGroup.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        });

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [nodes, edges, width, height, handleNodeClick, highlightedNodeId, interactive]);

    // Update hovered node styling
    useEffect(() => {
        if (!svgRef.current) return;
        
        const svg = d3.select(svgRef.current);
        
        svg.selectAll('.nodes g circle')
            .attr('stroke-width', (d: any) => d.id === hoveredNode ? 3 : 2)
            .attr('filter', (d: any) => d.id === hoveredNode || d.id === highlightedNodeId ? 'url(#glow)' : null);
        
        svg.selectAll('.links line')
            .attr('stroke-opacity', (d: any) => {
                if (!hoveredNode) return 0.6;
                const source = typeof d.source === 'string' ? d.source : d.source.id;
                const target = typeof d.target === 'string' ? d.target : d.target.id;
                return source === hoveredNode || target === hoveredNode ? 1 : 0.2;
            });
    }, [hoveredNode, highlightedNodeId]);

    if (nodes.length === 0) {
        return (
            <div className={cn('flex items-center justify-center text-muted-foreground', className)} style={{ width, height }}>
                <p className="text-sm">No connections to display</p>
            </div>
        );
    }

    return (
        <div className={cn('relative overflow-hidden rounded-xl bg-muted/30 border border-border/50', className)}>
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="w-full h-auto"
                style={{ maxHeight: height }}
                onClick={() => {
                    // On mobile, clicking outside nodes should stop interaction
                    if (isMobile && isInteracting) {
                        setIsInteracting(false);
                    }
                }}
            />
            
            {/* Mobile Interaction Overlay */}
            {isMobile && interactive && !isInteracting && (
                <div 
                    className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10 cursor-pointer"
                    onClick={() => setIsInteracting(true)}
                >
                    <div className="text-center">
                        <div className="text-lg font-medium mb-2">Tap to Explore Graph</div>
                        <div className="text-sm text-muted-foreground">Drag nodes to move around</div>
                    </div>
                </div>
            )}
            
            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-xs">
                {Object.entries(categoryColors).filter(([k]) => k !== 'default').slice(0, 4).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="capitalize text-muted-foreground">{category}</span>
                    </div>
                ))}
            </div>

            {/* Instructions */}
            {interactive && !isMobile && (
                <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    Drag nodes • Scroll to zoom • Click to explore
                </div>
            )}
            
            {/* Mobile Instructions */}
            {isMobile && isInteracting && (
                <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    Tap outside to stop
                </div>
            )}
        </div>
    );
}

export default ForceGraph;
