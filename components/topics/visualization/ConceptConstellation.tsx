'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ConceptNode {
    id: string;
    label: string;
    type: 'main' | 'parent' | 'child' | 'opposite';
    color: string;
}

interface ConceptConstellationProps {
    centerConcept: string;
    relatedConcepts: {
        parent?: string;
        opposite?: string;
        components?: string[];
    };
    onNodeClick?: (node: string, type: string) => void;
}

/**
 * ConceptConstellation - Clean, minimal node graph
 * Apple-quality: readable text, subtle design, no visual noise
 */
export function ConceptConstellation({ centerConcept, relatedConcepts, onNodeClick }: ConceptConstellationProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Build nodes array
    const nodes: ConceptNode[] = useMemo(() => {
        const list: ConceptNode[] = [
            { id: 'main', label: centerConcept, type: 'main', color: '#0ea5e9' },
        ];
        if (relatedConcepts.parent) {
            list.push({ id: 'parent', label: relatedConcepts.parent, type: 'parent', color: '#8b5cf6' });
        }
        if (relatedConcepts.opposite) {
            list.push({ id: 'opposite', label: relatedConcepts.opposite, type: 'opposite', color: '#ef4444' });
        }
        if (relatedConcepts.components) {
            relatedConcepts.components.slice(0, 3).forEach((comp, i) => {
                list.push({ id: `child-${i}`, label: comp, type: 'child', color: '#10b981' });
            });
        }
        return list;
    }, [centerConcept, relatedConcepts]);

    const handleClick = useCallback((node: ConceptNode) => {
        onNodeClick?.(node.label, node.type);
    }, [onNodeClick]);

    // Calculate positions based on node count
    const getNodePosition = (node: ConceptNode, index: number, total: number) => {
        if (node.type === 'main') return { x: 50, y: 50 }; // Center
        
        // Distribute other nodes around center
        const otherNodes = nodes.filter(n => n.type !== 'main');
        const otherIndex = otherNodes.findIndex(n => n.id === node.id);
        const count = otherNodes.length;
        
        if (count === 1) return { x: 50, y: 15 }; // Single node above
        if (count === 2) {
            return otherIndex === 0 ? { x: 25, y: 20 } : { x: 75, y: 20 };
        }
        // 3+ nodes: spread in arc above
        const angle = -Math.PI / 2 + (otherIndex - (count - 1) / 2) * (Math.PI / (count + 1));
        const radius = 35;
        return {
            x: 50 + Math.cos(angle) * radius,
            y: 50 + Math.sin(angle) * radius * 0.8
        };
    };

    const mainNode = nodes.find(n => n.type === 'main')!;
    const otherNodes = nodes.filter(n => n.type !== 'main');

    return (
        <div 
            className="w-full max-w-md mx-auto"
            role="img"
            aria-label={`Concept map: ${centerConcept} and related concepts`}
        >
            <div className="relative bg-muted/30 rounded-2xl border border-border/50 p-6 min-h-[220px]">
                <svg 
                    viewBox="0 0 100 100" 
                    className="w-full h-auto"
                    style={{ minHeight: 180, maxHeight: 240 }}
                >
                    {/* Connection lines - simple and subtle */}
                    {otherNodes.map((node, i) => {
                        const pos = getNodePosition(node, i, nodes.length);
                        const mainPos = getNodePosition(mainNode, 0, nodes.length);
                        const isHovered = hoveredNode === node.id || hoveredNode === 'main';
                        
                        return (
                            <motion.line
                                key={`line-${node.id}`}
                                x1={`${mainPos.x}%`}
                                y1={`${mainPos.y}%`}
                                x2={`${pos.x}%`}
                                y2={`${pos.y}%`}
                                stroke="currentColor"
                                strokeWidth={1}
                                className={`transition-opacity duration-200 ${isHovered ? 'opacity-30' : 'opacity-10'}`}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 * i }}
                            />
                        );
                    })}

                    {/* All nodes */}
                    {nodes.map((node, i) => {
                        const pos = getNodePosition(node, i, nodes.length);
                        const isMain = node.type === 'main';
                        const isHovered = hoveredNode === node.id;
                        const radius = isMain ? 8 : 5;

                        return (
                            <g key={node.id}>
                                {/* Clickable circle */}
                                <motion.circle
                                    cx={`${pos.x}%`}
                                    cy={`${pos.y}%`}
                                    r={radius}
                                    fill={node.color}
                                    className="cursor-pointer"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ 
                                        scale: isHovered ? 1.15 : 1, 
                                        opacity: isMain ? 1 : 0.85 
                                    }}
                                    transition={{ 
                                        delay: i * 0.08,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleClick(node)}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${node.label}${node.type !== 'main' ? ` (${node.type})` : ''}`}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleClick(node); }}
                                    style={{
                                        filter: isHovered ? `drop-shadow(0 0 8px ${node.color}80)` : 'none'
                                    }}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Labels rendered as HTML for crisp text */}
                <div className="absolute inset-0 pointer-events-none p-6">
                    <div className="relative w-full h-full" style={{ minHeight: 180 }}>
                        {nodes.map((node, i) => {
                            const pos = getNodePosition(node, i, nodes.length);
                            const isMain = node.type === 'main';
                            const isHovered = hoveredNode === node.id;

                            return (
                                <motion.div
                                    key={`label-${node.id}`}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                    className="absolute text-center pointer-events-auto"
                                    style={{
                                        left: `${pos.x}%`,
                                        top: `${pos.y}%`,
                                        transform: `translate(-50%, ${isMain ? '14px' : '10px'})`,
                                    }}
                                >
                                    <button
                                        onClick={() => handleClick(node)}
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        className={`
                                            block px-2 py-0.5 rounded-md transition-all duration-150
                                            ${isMain 
                                                ? 'text-sm font-semibold text-foreground' 
                                                : 'text-xs text-muted-foreground hover:text-foreground'
                                            }
                                            ${isHovered ? 'bg-muted' : ''}
                                        `}
                                    >
                                        {node.label}
                                    </button>
                                    {!isMain && (
                                        <span 
                                            className="block text-[10px] text-muted-foreground/50 capitalize mt-0.5"
                                            style={{ color: node.color }}
                                        >
                                            {node.type}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Minimal hint */}
            <p className="text-center text-xs text-muted-foreground/50 mt-3">
                Click any concept to explore
            </p>
        </div>
    );
}
