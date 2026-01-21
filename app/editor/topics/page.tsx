'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { Topic } from '@/lib/types';

export default function TopicsEditorPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadTopics();
    }
  }, [user]);

  useEffect(() => {
    filterTopics();
  }, [topics, searchQuery, filterType]);

  const checkAuth = () => {
    // In development, allow access without auth
    const isDev = process.env.NODE_ENV === 'development';
    const token = localStorage.getItem('auth_token');
    
    if (!token && !isDev) {
      router.push('/auth/signin');
      return;
    }

    // Set user (real or dev placeholder)
    setUser({ role: 'editor', name: isDev && !token ? 'Dev User' : 'Editor User' });
    setAuthLoading(false);
  };

  const loadTopics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/topics?limit=100');
      if (response.ok) {
        const data = await response.json();
        // Handle both { data: [...] } and { topics: [...] } formats
        setTopics(data.data || data.topics || []);
      } else {
        console.error('Failed to load topics');
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = topics;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(topic =>
        topic.canonical_title?.toLowerCase().includes(query) ||
        topic.description?.toLowerCase().includes(query) ||
        topic.topic_type?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(topic => topic.topic_type === filterType);
    }

    setFilteredTopics(filtered);
  };

  const getTopicTypeColor = (type: string) => {
    const colors = {
      concept: 'bg-blue-500/10 text-blue-600',
      practice: 'bg-green-500/10 text-green-600',
      virtue: 'bg-purple-500/10 text-purple-600',
      philosophy: 'bg-orange-500/10 text-orange-600',
      kabbalah: 'bg-red-500/10 text-red-600',
      chassidus: 'bg-indigo-500/10 text-indigo-600'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-600';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/editor')}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Editor
              </button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Topics Editor</h1>
                <p className="text-sm text-muted-foreground">{filteredTopics.length} topics</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/editor/topics/new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Topic
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="all">All Types ({topics.length})</option>
              <option value="concept">Concepts ({topics.filter(t => t.topic_type === 'concept').length})</option>
              <option value="person">People ({topics.filter(t => t.topic_type === 'person').length})</option>
              <option value="place">Places ({topics.filter(t => t.topic_type === 'place').length})</option>
              <option value="event">Events ({topics.filter(t => t.topic_type === 'event').length})</option>
              <option value="mitzvah">Mitzvot ({topics.filter(t => t.topic_type === 'mitzvah').length})</option>
              <option value="sefirah">Sefirot ({topics.filter(t => t.topic_type === 'sefirah').length})</option>
            </select>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTopics.map((topic: any) => (
            <div
              key={topic.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => router.push(`/editor/topics/${topic.slug}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {/* Hebrew Title */}
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-lg" dir="rtl">
                    {topic.canonical_title}
                  </h3>
                  {/* English Title or Transliteration */}
                  {(topic.canonical_title_en || topic.canonical_title_transliteration) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {topic.canonical_title_en || topic.canonical_title_transliteration}
                    </p>
                  )}
                  {topic.topic_type && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2 ${getTopicTypeColor(topic.topic_type)}`}>
                      {topic.topic_type}
                    </span>
                  )}
                </div>
                <Edit3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
              </div>

              {topic.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {topic.description.replace(/<[^>]*>/g, '').substring(0, 150)}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                <span className="font-mono">/{topic.slug}</span>
                <span className="text-primary group-hover:underline">Edit →</span>
              </div>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <Edit3 className="mx-auto h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No topics found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No topics have been created yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
