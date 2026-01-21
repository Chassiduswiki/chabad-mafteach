/**
 * SerendipityEngine - Discover Unexpected Connections
 * 
 * Surfaces surprising relationships between concepts that users
 * might not have considered. Creates "aha moments" by finding:
 * 
 * 1. Cross-category connections (e.g., a Mitzvah concept related to Mussar)
 * 2. Shared sources across different topics
 * 3. Linguistic/semantic similarities
 * 4. Contrasting concepts that illuminate each other
 * 
 * Philosophy: The best learning happens when you discover something
 * you weren't looking for.
 */

export interface SerendipitousConnection {
    /** The source topic */
    fromTopic: {
        slug: string;
        title: string;
        category?: string;
    };
    /** The discovered related topic */
    toTopic: {
        slug: string;
        title: string;
        category?: string;
    };
    /** Type of connection discovered */
    connectionType: 'cross-category' | 'shared-source' | 'semantic' | 'contrast' | 'unexpected';
    /** Human-readable explanation of why this is interesting */
    insight: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** The shared element (source title, concept, etc.) */
    sharedElement?: string;
}

export interface SerendipityOptions {
    /** Current topic slug to find connections from */
    currentTopic?: string;
    /** Categories to explore (empty = all) */
    categories?: string[];
    /** Maximum connections to return */
    limit?: number;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Exclude already-known relationships */
    excludeKnownRelations?: boolean;
}

/**
 * Fetch serendipitous connections from the API
 */
export async function discoverConnections(
    options: SerendipityOptions = {}
): Promise<SerendipitousConnection[]> {
    const {
        currentTopic,
        categories = [],
        limit = 3,
        minConfidence = 0.5,
        excludeKnownRelations = true,
    } = options;

    try {
        const params = new URLSearchParams();
        if (currentTopic) params.set('topic', currentTopic);
        if (categories.length) params.set('categories', categories.join(','));
        params.set('limit', String(limit));
        params.set('minConfidence', String(minConfidence));
        params.set('excludeKnown', String(excludeKnownRelations));

        const res = await fetch(`/api/serendipity?${params.toString()}`);
        
        if (!res.ok) {
            // Fallback to mock data if API not available
            return generateMockConnections(currentTopic, limit);
        }

        const data = await res.json();
        return data.connections || [];
    } catch (error) {
        console.warn('SerendipityEngine: API unavailable, using mock data');
        return generateMockConnections(currentTopic, limit);
    }
}

/**
 * Generate mock serendipitous connections for demo/fallback
 */
function generateMockConnections(
    currentTopic?: string,
    limit: number = 3
): SerendipitousConnection[] {
    const mockConnections: SerendipitousConnection[] = [
        {
            fromTopic: { slug: currentTopic || 'emunah', title: currentTopic ? toTitleCase(currentTopic) : 'Emunah', category: 'Belief' },
            toTopic: { slug: 'simcha', title: 'Simcha', category: 'Emotion' },
            connectionType: 'cross-category',
            insight: 'Both concepts share the idea of transcending rational limitations—faith goes beyond understanding, joy goes beyond circumstance.',
            confidence: 0.78,
            sharedElement: 'Transcendence of intellect',
        },
        {
            fromTopic: { slug: currentTopic || 'teshuvah', title: currentTopic ? toTitleCase(currentTopic) : 'Teshuvah', category: 'Practice' },
            toTopic: { slug: 'bitul', title: 'Bitul', category: 'Middos' },
            connectionType: 'semantic',
            insight: 'Teshuvah at its deepest level involves bitul—complete self-nullification. The Alter Rebbe calls this "teshuvah ila\'ah."',
            confidence: 0.85,
            sharedElement: 'Self-transcendence',
        },
        {
            fromTopic: { slug: currentTopic || 'ahavah', title: currentTopic ? toTitleCase(currentTopic) : 'Ahavah', category: 'Emotion' },
            toTopic: { slug: 'yirah', title: 'Yirah', category: 'Emotion' },
            connectionType: 'contrast',
            insight: 'Often presented as opposites, but Tanya explains they are "two wings" that work together—love draws close, awe creates reverence.',
            confidence: 0.92,
            sharedElement: 'Dual aspects of service',
        },
        {
            fromTopic: { slug: 'chochmah', title: 'Chochmah', category: 'Sefiros' },
            toTopic: { slug: 'ayin', title: 'Ayin', category: 'Kabbalistic' },
            connectionType: 'shared-source',
            insight: 'Both discussed extensively in Tanya Chapter 35, where the flash of Chochmah is described as emerging from Ayin (nothingness).',
            confidence: 0.88,
            sharedElement: 'Tanya Ch. 35',
        },
        {
            fromTopic: { slug: 'nefesh-habehamis', title: 'Nefesh HaBehamis', category: 'Soul' },
            toTopic: { slug: 'kedushah', title: 'Kedushah', category: 'Spiritual' },
            connectionType: 'unexpected',
            insight: 'The animal soul isn\'t simply "bad"—when its passion is redirected toward holiness, it becomes the engine of intense divine service.',
            confidence: 0.75,
            sharedElement: 'Transformation potential',
        },
    ];

    // Filter to relevant connections if currentTopic provided
    let filtered = currentTopic
        ? mockConnections.filter(c => 
            c.fromTopic.slug === currentTopic || 
            c.toTopic.slug === currentTopic ||
            Math.random() > 0.5 // Include some random ones for variety
          )
        : mockConnections;

    // Shuffle and limit
    filtered = filtered.sort(() => Math.random() - 0.5).slice(0, limit);

    return filtered;
}

/**
 * Get a "daily discovery" - a single surprising connection
 */
export async function getDailyDiscovery(): Promise<SerendipitousConnection | null> {
    const connections = await discoverConnections({ limit: 1, minConfidence: 0.7 });
    return connections[0] || null;
}

/**
 * Get connections specifically for a topic page
 */
export async function getTopicSerendipity(
    topicSlug: string,
    limit: number = 2
): Promise<SerendipitousConnection[]> {
    return discoverConnections({
        currentTopic: topicSlug,
        limit,
        minConfidence: 0.6,
        excludeKnownRelations: true,
    });
}

/**
 * Helper: Convert slug to title case
 */
function toTitleCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Connection type descriptions for UI
 */
export const connectionTypeLabels: Record<SerendipitousConnection['connectionType'], { label: string; color: string }> = {
    'cross-category': { label: 'Cross-Category', color: 'text-purple-600 dark:text-purple-400' },
    'shared-source': { label: 'Shared Source', color: 'text-blue-600 dark:text-blue-400' },
    'semantic': { label: 'Deep Connection', color: 'text-emerald-600 dark:text-emerald-400' },
    'contrast': { label: 'Illuminating Contrast', color: 'text-amber-600 dark:text-amber-400' },
    'unexpected': { label: 'Unexpected Link', color: 'text-pink-600 dark:text-pink-400' },
};

export default {
    discoverConnections,
    getDailyDiscovery,
    getTopicSerendipity,
    connectionTypeLabels,
};
