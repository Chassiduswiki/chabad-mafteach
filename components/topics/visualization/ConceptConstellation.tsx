'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

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
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [clickedNode, setClickedNode] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    
    // Responsive sizing
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const width = isMobile ? 320 : 420;
    const height = isMobile ? 280 : 360;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes: ConceptNode[] = useMemo(() => {
        const list: ConceptNode[] = [
            { id: 'main', label: centerConcept, type: 'main', x: centerX, y: centerY, color: '#0ea5e9' },
        ];

        if (relatedConcepts.parent) {
            list.push({ id: 'parent', label: relatedConcepts.parent, type: 'parent', x: centerX, y: isMobile ? 50 : 70, color: '#8b5cf6' });
        }

        if (relatedConcepts.opposite) {
            list.push({ id: 'opposite', label: relatedConcepts.opposite, type: 'opposite', x: width - (isMobile ? 50 : 70), y: centerY + 20, color: '#ef4444' });
        }

        if (relatedConcepts.components) {
            const count = relatedConcepts.components.length;
            const spacing = isMobile ? 90 : 120;
            const startX = centerX - ((count - 1) * spacing / 2);

            relatedConcepts.components.slice(0, 3).forEach((comp, i) => {
                list.push({
                    id: `comp-${i}`,
                    label: comp,
                    type: 'child',
                    x: Math.max(50, Math.min(width - 50, startX + (i * spacing))),
                    y: height - (isMobile ? 50 : 70),
                    color: '#10b981'
                });
            });
        }
        return list;
    }, [centerConcept, relatedConcepts, centerX, centerY, width, height, isMobile]);

    const handleNodeClick = useCallback((label: string, type: string) => {
        setClickedNode(label);
        setTimeout(() => setClickedNode(null), 600);
        onNodeClick?.(label, type);
    }, [onNodeClick]);

    // Breathing animation config
    const breatheAnimation = {
        scale: [1, 1.02, 1],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut" as const
        }
    };

    // Floating animation for nodes
    const getFloatAnimation = (delay: number, amplitude: number = 3) => ({
        y: [0, -amplitude, 0, amplitude, 0],
        x: [0, amplitude * 0.5, 0, -amplitude * 0.5, 0],
        transition: {
            duration: 6 + delay,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: delay * 0.3
        }
    });

    // Pulse ring animation
    const pulseRingAnimation = {
        scale: [1, 1.5, 2],
        opacity: [0.4, 0.2, 0],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeOut" as const
        }
    };

    // Click ripple effect
    const rippleAnimation = {
        scale: [0, 3],
        opacity: [0.6, 0],
        transition: { duration: 0.6, ease: "easeOut" as const }
    };

    return (
        <div 
            className={`w-full ${isMobile ? 'h-[320px]' : 'h-[400px]'} relative flex flex-col items-center justify-center rounded-3xl overflow-hidden bg-gradient-to-br from-background via-muted/5 to-muted/20 border border-white/5 shadow-2xl group/graph`}
            role="img"
            aria-label={`Concept constellation showing ${centerConcept} and related concepts`}
        >
            {/* Animated Ambient Background */}
            <motion.div 
                className="absolute inset-0 overflow-hidden pointer-events-none"
                animate={breatheAnimation}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_40%)] opacity-[0.04] blur-3xl" />
                <div className="absolute top-1/4 right-1/4 w-[40%] h-[40%] bg-purple-500/5 blur-[80px] rounded-full" />
                <div className="absolute bottom-1/4 left-1/4 w-[30%] h-[30%] bg-emerald-500/5 blur-[60px] rounded-full" />
            </motion.div>

            <svg 
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${width} ${height}`} 
                className={`${isMobile ? 'max-w-[340px]' : 'max-w-[460px]'} relative z-10 overflow-visible`}
            >
                <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Animated Connection Lines with Energy Flow */}
                {nodes.filter(n => n.type !== 'main').map((node, i) => {
                    const isHovered = hoveredNode === node.id || hoveredNode === 'main';
                    return (
                        <g key={`line-group-${i}`}>
                            {/* Base line */}
                            <motion.line
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: isHovered ? 0.6 : 0.25 }}
                                transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                                x1={centerX}
                                y1={centerY}
                                x2={node.x}
                                y2={node.y}
                                stroke={node.color}
                                strokeWidth={isHovered ? 2 : 1}
                                strokeLinecap="round"
                                className="transition-all duration-300"
                            />
                            {/* Animated particle along line */}
                            <motion.circle
                                r={2}
                                fill={node.color}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    cx: [centerX, node.x],
                                    cy: [centerY, node.y],
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    delay: i * 0.8,
                                    ease: "easeInOut"
                                }}
                                filter="url(#glow)"
                            />
                        </g>
                    );
                })}

                {/* Nodes with floating animation */}
                {nodes.map((node, i) => {
                    const isMain = node.type === 'main';
                    const isHovered = hoveredNode === node.id;
                    const isClicked = clickedNode === node.label;
                    const nodeRadius = isMain ? (isMobile ? 28 : 36) : (isMobile ? 16 : 22);

                    return (
                        <motion.g
                            key={node.id}
                            animate={getFloatAnimation(i, isMain ? 2 : 4)}
                            onClick={() => handleNodeClick(node.label, node.type)}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onFocus={() => setHoveredNode(node.id)}
                            onBlur={() => setHoveredNode(null)}
                            className="cursor-pointer outline-none"
                            tabIndex={0}
                            role="button"
                            aria-label={`${node.label} - ${node.type} concept. Click to view details.`}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNodeClick(node.label, node.type); }}
                        >
                            {/* Click Ripple Effect */}
                            <AnimatePresence>
                                {isClicked && (
                                    <motion.circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={nodeRadius}
                                        fill="transparent"
                                        stroke={node.color}
                                        strokeWidth={2}
                                        initial={{ scale: 0, opacity: 0.8 }}
                                        animate={rippleAnimation}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Pulse Ring for Main Node */}
                            {isMain && (
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={nodeRadius}
                                    fill="transparent"
                                    stroke={node.color}
                                    strokeWidth={1}
                                    initial={{ scale: 1, opacity: 0.6 }}
                                    animate={pulseRingAnimation}
                                />
                            )}

                            {/* Hover glow ring */}
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={nodeRadius + 8}
                                fill="transparent"
                                stroke={node.color}
                                strokeWidth={isHovered ? 2 : 0}
                                opacity={isHovered ? 0.3 : 0}
                                initial={false}
                                animate={{ opacity: isHovered ? 0.3 : 0 }}
                                transition={{ duration: 0.2 }}
                            />

                            {/* Main Node Circle */}
                            <motion.circle
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ 
                                    scale: isHovered ? 1.1 : 1, 
                                    opacity: 1 
                                }}
                                transition={{
                                    delay: i * 0.12,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                }}
                                cx={node.x}
                                cy={node.y}
                                r={nodeRadius}
                                fill="var(--background)"
                                stroke={node.color}
                                strokeWidth={isMain ? 2.5 : 1.5}
                                style={{
                                    filter: isHovered 
                                        ? `drop-shadow(0 0 20px ${node.color}60)` 
                                        : isMain 
                                            ? `drop-shadow(0 4px 16px ${node.color}30)` 
                                            : 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))'
                                }}
                            />

                            {/* Inner colored dot */}
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 400 }}
                                cx={node.x}
                                cy={node.y}
                                r={isMain ? 8 : 5}
                                fill={node.color}
                                opacity={0.8}
                            />

                            {/* Label */}
                            <foreignObject
                                x={node.x - (isMobile ? 50 : 65)}
                                y={node.y + nodeRadius + 4}
                                width={isMobile ? 100 : 130}
                                height="40"
                                className="overflow-visible pointer-events-none"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="flex flex-col items-center justify-start"
                                >
                                    <span
                                        className={`
                                            text-center leading-tight transition-all duration-200 px-2 py-0.5 rounded-md
                                            ${isMain 
                                                ? 'text-foreground font-semibold text-sm' 
                                                : `text-muted-foreground text-xs ${isHovered ? 'text-foreground bg-muted/50' : ''}`
                                            }
                                        `}
                                    >
                                        {node.label}
                                    </span>
                                    {!isMain && (
                                        <span className="text-[10px] text-muted-foreground/60 capitalize mt-0.5">
                                            {node.type}
                                        </span>
                                    )}
                                </motion.div>
                            </foreignObject>
                        </motion.g>
                    );
                })}
            </svg>

            {/* Interactive Caption */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-3 sm:bottom-4 flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground/60"
            >
                <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-primary/50"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <span>Click nodes to explore • Tap for details</span>
            </motion.div>

            {/* Keyboard hint for accessibility */}
            <div className="sr-only">
                Use Tab to navigate between concepts and Enter to select.
            </div>
        </div>
    );
}
