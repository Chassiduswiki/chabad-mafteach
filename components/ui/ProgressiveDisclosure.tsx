'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Layers, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeInUp } from '@/lib/animations';

/**
 * Progressive Disclosure System
 * 
 * 4-level depth system inspired by Obsidian:
 * 1. Overview - Quick summary (always visible)
 * 2. Deep Dive - Detailed explanation
 * 3. Sources - References and citations
 * 4. Expert - Advanced/technical details
 */

export type DepthLevel = 'overview' | 'deep-dive' | 'sources' | 'expert';

interface DepthConfig {
    level: DepthLevel;
    label: string;
    icon: typeof Layers;
    color: string;
    bgColor: string;
}

const depthConfigs: DepthConfig[] = [
    { level: 'overview', label: 'Overview', icon: Layers, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
    { level: 'deep-dive', label: 'Deep Dive', icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
    { level: 'sources', label: 'Sources', icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
    { level: 'expert', label: 'Expert', icon: Sparkles, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
];

interface ProgressiveDisclosureProps {
    /** Content for each depth level */
    content: {
        overview: ReactNode;
        'deep-dive'?: ReactNode;
        sources?: ReactNode;
        expert?: ReactNode;
    };
    /** Initial depth level */
    initialDepth?: DepthLevel;
    /** Callback when depth changes */
    onDepthChange?: (depth: DepthLevel) => void;
    /** Additional className */
    className?: string;
    /** Show depth selector */
    showDepthSelector?: boolean;
}

export function ProgressiveDisclosure({
    content,
    initialDepth = 'overview',
    onDepthChange,
    className,
    showDepthSelector = true,
}: ProgressiveDisclosureProps) {
    const [currentDepth, setCurrentDepth] = useState<DepthLevel>(initialDepth);

    const availableLevels = depthConfigs.filter(
        config => content[config.level] !== undefined
    );

    const currentIndex = availableLevels.findIndex(c => c.level === currentDepth);
    const canGoDeeper = currentIndex < availableLevels.length - 1;
    const canGoShallower = currentIndex > 0;

    const handleDepthChange = useCallback((level: DepthLevel) => {
        setCurrentDepth(level);
        onDepthChange?.(level);
    }, [onDepthChange]);

    const goDeeper = useCallback(() => {
        if (canGoDeeper) {
            handleDepthChange(availableLevels[currentIndex + 1].level);
        }
    }, [canGoDeeper, currentIndex, availableLevels, handleDepthChange]);

    const goShallower = useCallback(() => {
        if (canGoShallower) {
            handleDepthChange(availableLevels[currentIndex - 1].level);
        }
    }, [canGoShallower, currentIndex, availableLevels, handleDepthChange]);

    const currentConfig = depthConfigs.find(c => c.level === currentDepth)!;
    const Icon = currentConfig.icon;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Depth Selector */}
            {showDepthSelector && availableLevels.length > 1 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {availableLevels.map((config, index) => {
                            const isActive = config.level === currentDepth;
                            const isPast = index < currentIndex;
                            const ConfigIcon = config.icon;

                            return (
                                <button
                                    key={config.level}
                                    onClick={() => handleDepthChange(config.level)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                        isActive
                                            ? `${config.bgColor} ${config.color}`
                                            : isPast
                                                ? 'bg-muted text-muted-foreground'
                                                : 'bg-transparent text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    <ConfigIcon className="w-3 h-3" />
                                    <span className="hidden sm:inline">{config.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goShallower}
                            disabled={!canGoShallower}
                            className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                canGoShallower
                                    ? 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    : 'opacity-30 cursor-not-allowed'
                            )}
                            aria-label="Show less detail"
                        >
                            <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goDeeper}
                            disabled={!canGoDeeper}
                            className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                canGoDeeper
                                    ? 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    : 'opacity-30 cursor-not-allowed'
                            )}
                            aria-label="Show more detail"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentDepth}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {content[currentDepth]}
                </motion.div>
            </AnimatePresence>

            {/* "Go Deeper" prompt */}
            {canGoDeeper && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={goDeeper}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span>Want more detail?</span>
                    <span className={cn('font-medium', availableLevels[currentIndex + 1]?.color)}>
                        {availableLevels[currentIndex + 1]?.label}
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                </motion.button>
            )}
        </div>
    );
}

/**
 * Collapsible Section - Simple expand/collapse pattern
 */
interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
    icon?: typeof Layers;
    badge?: string;
    className?: string;
}

export function CollapsibleSection({
    title,
    children,
    defaultOpen = false,
    icon: Icon,
    badge,
    className,
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn('border border-border rounded-xl overflow-hidden', className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium text-foreground">{title}</span>
                    {badge && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <ChevronDown 
                    className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )} 
                />
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 border-t border-border">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Content Complexity Indicator
 * Shows the depth/complexity of content visually
 */
interface ComplexityIndicatorProps {
    level: 1 | 2 | 3 | 4 | 5;
    label?: string;
    className?: string;
}

export function ComplexityIndicator({ level, label, className }: ComplexityIndicatorProps) {
    const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    const colors = [
        'bg-emerald-500',
        'bg-blue-500', 
        'bg-purple-500',
        'bg-amber-500',
        'bg-red-500',
    ];

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            'w-1.5 h-4 rounded-full transition-colors',
                            i <= level ? colors[level - 1] : 'bg-muted'
                        )}
                    />
                ))}
            </div>
            {(label || labels[level - 1]) && (
                <span className="text-xs text-muted-foreground">
                    {label || labels[level - 1]}
                </span>
            )}
        </div>
    );
}

/**
 * Nested Content Embed - For embedding related content inline
 */
interface NestedEmbedProps {
    type: 'topic' | 'source' | 'quote' | 'audio' | 'external';
    title: string;
    preview?: string;
    href?: string;
    onExpand?: () => void;
    children?: ReactNode;
    className?: string;
}

export function NestedEmbed({
    type,
    title,
    preview,
    href,
    onExpand,
    children,
    className,
}: NestedEmbedProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const typeConfig = {
        topic: { icon: Layers, color: 'border-l-blue-500' },
        source: { icon: BookOpen, color: 'border-l-purple-500' },
        quote: { icon: GraduationCap, color: 'border-l-amber-500' },
        audio: { icon: Sparkles, color: 'border-l-emerald-500' },
        external: { icon: Sparkles, color: 'border-l-gray-500' },
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    const handleClick = () => {
        if (onExpand) {
            onExpand();
        } else if (children) {
            setIsExpanded(!isExpanded);
        } else if (href) {
            window.open(href, '_blank');
        }
    };

    return (
        <div 
            className={cn(
                'border-l-4 bg-muted/30 rounded-r-lg overflow-hidden',
                config.color,
                className
            )}
        >
            <button
                onClick={handleClick}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
            >
                <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground block truncate">{title}</span>
                    {preview && (
                        <span className="text-sm text-muted-foreground line-clamp-2">{preview}</span>
                    )}
                </div>
                {children && (
                    <ChevronDown 
                        className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform flex-shrink-0',
                            isExpanded && 'rotate-180'
                        )} 
                    />
                )}
            </button>

            <AnimatePresence>
                {isExpanded && children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border"
                    >
                        <div className="p-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ProgressiveDisclosure;
