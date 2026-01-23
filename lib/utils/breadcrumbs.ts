/**
 * Breadcrumb Utilities
 * 
 * Helper functions to generate breadcrumb trails for different page types.
 * Used across the application to provide consistent navigation context.
 * 
 * @example
 * ```tsx
 * import { getTopicBreadcrumbs } from '@/lib/utils/breadcrumbs';
 * 
 * const breadcrumbs = getTopicBreadcrumbs(topic);
 * // Returns: [{ label: 'Home', href: '/' }, { label: 'Topics', href: '/topics' }, ...]
 * ```
 */

export interface BreadcrumbItem {
    label: string;
    href: string;
}

/**
 * Generate breadcrumbs for topic detail pages
 */
export function getTopicBreadcrumbs(topic: {
    canonical_title?: string;
    topic_type?: string;
    slug?: string;
}): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Topics', href: '/topics' },
    ];

    if (topic.topic_type) {
        const categoryLabel = topic.topic_type.charAt(0).toUpperCase() + topic.topic_type.slice(1) + 's';
        breadcrumbs.push({
            label: categoryLabel,
            href: `/topics?category=${topic.topic_type}`,
        });
    }

    if (topic.canonical_title) {
        breadcrumbs.push({
            label: topic.canonical_title,
            href: `/topics/${topic.slug}`,
        });
    }

    return breadcrumbs;
}

/**
 * Generate breadcrumbs for admin pages
 */
export function getAdminBreadcrumbs(section?: string, itemName?: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Admin', href: '/admin' },
    ];

    if (section) {
        const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
        breadcrumbs.push({
            label: sectionLabel,
            href: `/admin/${section}`,
        });
    }

    if (itemName) {
        breadcrumbs.push({
            label: itemName,
            href: '#', // Current page
        });
    }

    return breadcrumbs;
}

/**
 * Generate breadcrumbs for editor pages
 */
export function getEditorBreadcrumbs(section?: string, itemName?: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Editor', href: '/editor' },
    ];

    if (section) {
        const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
        breadcrumbs.push({
            label: sectionLabel,
            href: `/editor/${section}`,
        });
    }

    if (itemName) {
        breadcrumbs.push({
            label: itemName,
            href: '#', // Current page
        });
    }

    return breadcrumbs;
}
