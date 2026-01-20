'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConceptNode {
    id: string;
    label: string;
    type: 'main' | 'parent' | 'child' | 'opposite' | 'related';
    x: number;
    y: number;
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
 * ConceptConstellation - Interactive Node Graph
 * Redesigned for a sleek, premium, and dynamic feel.
 */
export function ConceptConstellation({ centerConcept, relatedConcepts, onNodeClick }: ConceptConstellationProps) {
    const width = 380;
    const height = 320;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes: ConceptNode[] = useMemo(() => {
        const list: ConceptNode[] = [
            { id: 'main', label: centerConcept, type: 'main', x: centerX, y: centerY, color: '#0ea5e9' }, // Sky Blue
        ];

        if (relatedConcepts.parent) {
            list.push({ id: 'parent', label: relatedConcepts.parent, type: 'parent', x: centerX, y: 60, color: '#8b5cf6' }); // Violet
        }

        if (relatedConcepts.opposite) {
            list.push({ id: 'opposite', label: relatedConcepts.opposite, type: 'opposite', x: width - 60, y: centerY + 20, color: '#ef4444' }); // Red
        }

        if (relatedConcepts.components) {
            const count = relatedConcepts.components.length;
            const startX = centerX - ((count - 1) * 60); // Center the children appropriately

            relatedConcepts.components.slice(0, 3).forEach((comp, i) => {
                list.push({
                    id: `comp-${i}`,
                    label: comp,
                    type: 'child',
                    x: Math.max(60, Math.min(width - 60, startX + (i * 120))),
                    y: height - 60,
                    color: '#10b981' // Emerald
                });
            });
        }
        return list;
    }, [centerConcept, relatedConcepts, centerX, centerY, width, height]);

    return (
        <div className="w-full h-[360px] relative flex flex-col items-center justify-center rounded-3xl overflow-hidden bg-gradient-to-br from-background via-muted/5 to-muted/20 border border-white/5 shadow-2xl group/graph">
            {/* Ambient Background - Softer, deeply blurred */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_50%)] opacity-[0.03] blur-3xl" />
            </div>

            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="max-w-[420px] relative z-10 overflow-visible">
                <defs>
                    <linearGradient id="subtle-line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="50%" stopColor="currentColor" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Connections - Minimalist, only hint at connection */}
                {nodes.filter(n => n.type !== 'main').map((node, i) => (
                    <motion.line
                        key={`line-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                        x1={centerX}
                        y1={centerY}
                        x2={node.x}
                        y2={node.y}
                        stroke="url(#subtle-line)"
                        strokeWidth="1"
                        className="text-primary/50"
                    />
                ))}

                {/* Nodes */}
                {nodes.map((node, i) => (
                    <g
                        key={node.id}
                        onClick={() => onNodeClick?.(node.label, node.type)}
                        className="cursor-pointer group/node"
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    >
                        {/* Hover Interaction Area */}
                        <circle cx={node.x} cy={node.y} r={40} fill="transparent" />

                        {/* Node Visual - Clean, Solid, No Stroke rings */}
                        <motion.circle
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            transition={{
                                delay: i * 0.1,
                                type: "spring",
                                stiffness: 200,
                                damping: 15
                            }}
                            cx={node.x}
                            cy={node.y}
                            r={node.type === 'main' ? 32 : 20}
                            className={`${node.type === 'main' ? 'fill-background shadow-lg' : 'fill-background/80 shadow-sm'} backdrop-blur-md transition-all duration-300`}
                            // Add a subtle border glow instead of a stroke
                            style={{
                                filter: node.type === 'main' ? `drop-shadow(0 4px 12px ${node.color}40)` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
                            }}
                        />

                        {/* Inner Color Dot - Minimal indicator */}
                        {node.type === 'main' && (
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                cx={node.x}
                                cy={node.y}
                                r={32}
                                stroke={node.color}
                                strokeWidth={1.5}
                                fill="transparent"
                                className="opacity-20"
                            />
                        )}

                        {/* Label - Clean Typography */}
                        <foreignObject
                            x={node.x - 60}
                            y={node.y - (node.type === 'main' ? 12 : 10)} // Centered vertically 
                            width="120"
                            height="60"
                            className="overflow-visible pointer-events-none"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="flex flex-col items-center justify-center p-1"
                            >
                                <span
                                    className={`
                                        text-xs font-medium text-center leading-tight transition-colors duration-300
                                        ${node.type === 'main' ? 'text-foreground font-semibold text-sm' : 'text-muted-foreground group-hover/node:text-foreground'}
                                    `}
                                >
                                    {node.label}
                                </span>
                            </motion.div>
                        </foreignObject>
                    </g>
                ))}
            </svg>

            {/* Minimal Caption */}
            <div className="absolute bottom-4 text-[10px] items-center gap-1.5 text-muted-foreground/40 hidden sm:flex">
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                <span>Relationship Map</span>
            </div>
        </div>
    );
}
