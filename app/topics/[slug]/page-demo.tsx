import { notFound } from 'next/navigation';
import TopicTabs from '@/components/topics/TopicTabs';
import { TopicHeader } from '@/components/topics/TopicHeader';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ActionButtons } from '@/components/shared/ActionButtons';
import { TopicTracker } from '@/components/shared/TopicTracker';
import { getTopicBySlug, DemoTopic } from '@/data/demo-topics';

export const dynamic = 'force-dynamic';

async function getTopic(slug: string): Promise<DemoTopic | null> {
  try {
    // Try to get from demo data first
    const demoTopic = getTopicBySlug(slug);
    if (demoTopic) {
      console.log('✓ Using demo topic for slug:', slug);
      return demoTopic;
    }

    // If not found in demo, return null
    console.log('No demo topic found for slug:', slug);
    return null;
  } catch (error) {
    console.error('Error fetching topic:', error);
    return null;
  }
}

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await getTopic(slug);

  if (!topic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Track last visited topic for Continue Learning */}
      <TopicTracker slug={topic.slug} name={topic.name || topic.canonical_title} />

      <TopicHeader topic={topic} />

      <main className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: 'Topics', href: '/topics' },
              { label: topic.name || topic.canonical_title }
            ]}
          />
          <ActionButtons topic={topic} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content (Left 2/3) */}
          <div className="lg:col-span-2">
            <TopicTabs topic={topic} />
          </div>
        </div>
      </main>
    </div>
  );
}
