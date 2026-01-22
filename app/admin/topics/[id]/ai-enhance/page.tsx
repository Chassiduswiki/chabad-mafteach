'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AIAssistantPanel } from '@/components/editor/AIAssistantPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TopicAIEnhancePage() {
  const params = useParams();
  const topicId = params.id as string;
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        // In production, fetch from Directus
        const response = await fetch(`/api/topics/${topicId}`);
        const data = await response.json();
        setTopic(data);
      } catch (error) {
        console.error('Failed to fetch topic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  const handleContentGenerated = async (content: string) => {
    console.log('Generated content:', content);
    // In production, you could auto-save or show a preview
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href={`/admin/topics/${topicId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topic
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          AI Content Enhancement
        </h1>
        <p className="text-muted-foreground">
          {topic?.canonical_title || 'Topic'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AIAssistantPanel
            topicTitle={topic?.canonical_title}
            currentContent={topic?.article || topic?.overview || topic?.description}
            onContentGenerated={handleContentGenerated}
          />
        </div>

        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current Content</h2>
            <div className="prose prose-sm max-w-none">
              {topic?.article && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Article</h3>
                  <div className="text-sm">{topic.article}</div>
                </div>
              )}
              {topic?.overview && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Overview</h3>
                  <div className="text-sm">{topic.overview}</div>
                </div>
              )}
              {topic?.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <div className="text-sm">{topic.description}</div>
                </div>
              )}
              {!topic?.article && !topic?.overview && !topic?.description && (
                <p className="text-sm text-muted-foreground">No content available yet. Use the AI assistant to generate content.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
