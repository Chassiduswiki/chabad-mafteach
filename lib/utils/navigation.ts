/**
 * Navigation utilities for route validation, breadcrumb generation, and navigation helpers
 */

import { notFound } from 'next/navigation';

/**
 * Valid route patterns for the application
 */
const VALID_ROUTES = {
    home: '/',
    explore: '/explore',
    topics: '/topics',
    topicDetail: '/topics/[slug]',
    seforim: '/seforim',
    seferDetail: '/seforim/[id]',
    seferChapter: '/seforim/[id]/[chapter]',
    collections: '/collections',
    editor: '/editor',
    editorTopics: '/editor/topics',
    editorTopicDetail: '/editor/topics/[slug]',
} as const;

/**
 * Category configurations for topics and documents
 */
export const TOPIC_CATEGORIES = {
    concept: { name: 'Concepts', icon: '💡', description: 'Philosophical & spiritual ideas' },
    person: { name: 'People', icon: '👤', description: 'Rebbeim, Chassidim & Sages' },
    sefirah: { name: 'Sefirot', icon: '✨', description: 'Divine emanations & attributes' },
    mitzvah: { name: 'Mitzvot', icon: '📖', description: 'Divine commandments & deeds' },
    place: { name: 'Places', icon: '📍', description: 'Holy sites & geographic history' },
    event: { name: 'Events', icon: '📅', description: 'Historical moments & calendar' },
} as const;

export const DOCUMENT_CATEGORIES = {
    chassidus: { name: 'Chassidus', icon: '🔥', description: 'Inner dimensions of Torah' },
    tanach: { name: 'Tanach', icon: '📜', description: 'Torah, Prophets & Writings' },
    gemara: { name: 'Gemara', icon: '📚', description: 'Talmudic law & lore' },
    rishonim: { name: 'Rishonim', icon: '⏳', description: 'Early Commentators' },
    acharonim: { name: 'Acharonim', icon: '⚡', description: 'Later Authorities' },
    entry: { name: 'Entries', icon: '📝', description: 'Encyclopedia entries' },
    sefer: { name: 'Seforim', icon: '📖', description: 'Complete seforim' },
} as const;

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: string;
}

/**
 * Generate breadcrumbs from current path and context
 */
export function generateBreadcrumbs(
    pathname: string,
    context?: {
        topicSlug?: string;
        topicTitle?: string;
        topicCategory?: string;
        seferId?: string;
        seferTitle?: string;
        seferCategory?: string;
        chapter?: string;
    }
): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    const segments = pathname.split('/').filter(Boolean);

    // Always start with Home
    breadcrumbs.push({ label: 'Home', href: '/' });

    // Build breadcrumbs based on path
    if (segments[0] === 'topics') {
        breadcrumbs.push({ label: 'Topics', href: '/topics' });

        if (context?.topicCategory) {
            const categoryInfo = TOPIC_CATEGORIES[context.topicCategory as keyof typeof TOPIC_CATEGORIES];
            if (categoryInfo) {
                breadcrumbs.push({
                    label: categoryInfo.name,
                    href: `/topics?category=${context.topicCategory}`,
                    icon: categoryInfo.icon,
                });
            }
        }

        if (context?.topicTitle) {
            breadcrumbs.push({ label: context.topicTitle });
        }
    } else if (segments[0] === 'seforim') {
        breadcrumbs.push({ label: 'Seforim', href: '/seforim' });

        if (context?.seferCategory) {
            const categoryInfo = DOCUMENT_CATEGORIES[context.seferCategory as keyof typeof DOCUMENT_CATEGORIES];
            if (categoryInfo) {
                breadcrumbs.push({
                    label: categoryInfo.name,
                    href: `/seforim?category=${context.seferCategory}`,
                    icon: categoryInfo.icon,
                });
            }
        }

        if (context?.seferTitle) {
            breadcrumbs.push({
                label: context.seferTitle,
                href: context.seferId ? `/seforim/${context.seferId}` : undefined,
            });
        }

        if (context?.chapter) {
            breadcrumbs.push({ label: `Chapter ${context.chapter}` });
        }
    } else if (segments[0] === 'explore') {
        breadcrumbs.push({ label: 'Explore' });
    } else if (segments[0] === 'collections') {
        breadcrumbs.push({ label: 'Collections' });
    } else if (segments[0] === 'editor') {
        breadcrumbs.push({ label: 'Editor', href: '/editor' });

        if (segments[1] === 'topics') {
            breadcrumbs.push({ label: 'Topics', href: '/editor/topics' });

            if (context?.topicTitle) {
                breadcrumbs.push({ label: context.topicTitle });
            }
        }
    }

    return breadcrumbs;
}

/**
 * Validate if a route exists and is accessible
 */
export function validateRoute(pathname: string): boolean {
    // Remove query params and hash
    const cleanPath = pathname.split('?')[0].split('#')[0];

    // Check if it matches any valid route pattern
    const segments = cleanPath.split('/').filter(Boolean);

    if (cleanPath === '/') return true;
    if (cleanPath === '/explore') return true;
    if (cleanPath === '/topics') return true;
    if (cleanPath === '/seforim') return true;
    if (cleanPath === '/collections') return true;
    if (cleanPath === '/editor') return true;

    // Dynamic routes
    if (segments[0] === 'topics' && segments.length === 2) return true;
    if (segments[0] === 'seforim' && segments.length >= 2 && segments.length <= 3) return true;
    if (segments[0] === 'editor' && segments[1] === 'topics') return true;

    return false;
}

/**
 * Get category information by ID
 */
export function getCategoryInfo(categoryId: string, type: 'topic' | 'document') {
    if (type === 'topic') {
        return TOPIC_CATEGORIES[categoryId as keyof typeof TOPIC_CATEGORIES];
    }
    return DOCUMENT_CATEGORIES[categoryId as keyof typeof DOCUMENT_CATEGORIES];
}

/**
 * Detect if a page is a "cul-de-sac" (dead end with no outgoing links)
 */
export function isCulDeSac(
    hasContent: boolean,
    hasRelatedItems: boolean,
    hasNavigation: boolean
): boolean {
    // A page is a cul-de-sac if it has no content AND no related items AND no navigation
    return !hasContent && !hasRelatedItems && !hasNavigation;
}

/**
 * Get suggested navigation for a cul-de-sac page
 */
export function getCulDeSacSuggestions(pathname: string): BreadcrumbItem[] {
    const suggestions: BreadcrumbItem[] = [];

    if (pathname.startsWith('/topics')) {
        suggestions.push(
            { label: 'Browse All Topics', href: '/topics' },
            { label: 'Explore Categories', href: '/explore' },
            { label: 'Search', href: '/explore' }
        );
    } else if (pathname.startsWith('/seforim')) {
        suggestions.push(
            { label: 'Browse All Seforim', href: '/seforim' },
            { label: 'Explore Categories', href: '/explore' },
            { label: 'Search', href: '/explore' }
        );
    } else {
        suggestions.push(
            { label: 'Home', href: '/' },
            { label: 'Explore', href: '/explore' },
            { label: 'Topics', href: '/topics' },
            { label: 'Seforim', href: '/seforim' }
        );
    }

    return suggestions;
}

/**
 * Find similar/related content based on current context
 */
export async function findRelatedContent(
    type: 'topic' | 'document',
    currentId: string | number,
    category?: string
): Promise<any[]> {
    // This would typically query the database
    // For now, return empty array - to be implemented with actual DB queries
    return [];
}

/**
 * Validate category parameter
 */
export function isValidCategory(category: string, type: 'topic' | 'document'): boolean {
    if (type === 'topic') {
        return category in TOPIC_CATEGORIES;
    }
    return category in DOCUMENT_CATEGORIES;
}

/**
 * Get all valid categories for a type
 */
export function getValidCategories(type: 'topic' | 'document'): string[] {
    if (type === 'topic') {
        return Object.keys(TOPIC_CATEGORIES);
    }
    return Object.keys(DOCUMENT_CATEGORIES);
}
