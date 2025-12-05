import { useQuery } from '@tanstack/react-query';
import { Topic } from '@/lib/types';
import { API } from '@/lib/constants';

export interface TopicWithStats extends Topic {
    citation_count?: number;
}

interface TopicsResponse {
    topics: TopicWithStats[];
}

export function useFeaturedTopics() {
    return useQuery({
        queryKey: ['featured-topics'],
        queryFn: async () => {
            const res = await fetch(`/api/topics?mode=featured&limit=${API.LIMITS.FEATURED_TOPICS}`);
            if (!res.ok) {
                throw new Error('Failed to fetch featured topics');
            }
            const data = (await res.json()) as TopicsResponse;
            return data.topics;
        },
    });
}
