import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { TanyaChapterReader } from '@/components/tanya/TanyaChapterReader';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const dynamic = 'force-dynamic';

async function getChapterData(perek: string) {
  try {
    // Find paragraphs for this chapter (order_key starts with perek number)
    const paragraphs = await directus.request(readItems('paragraphs', {
      filter: {
        order_key: { _starts_with: `${perek}:` }
      } as any,
      fields: ['id', 'order_key', 'text'],
      sort: ['order_key']
    })) as any[];

    if (!paragraphs || paragraphs.length === 0) {
      return null;
    }

    // Get statements for these paragraphs
    const paragraphIds = paragraphs.map(p => p.id);
    const statements = await directus.request(readItems('statements', {
      filter: {
        paragraph_id: { _in: paragraphIds }
      } as any,
      fields: ['id', 'order_key', 'text', 'paragraph_id'],
      sort: ['order_key']
    })) as any[];

    return {
      paragraphs,
      statements: statements.map((s, index) => ({
        id: s.id,
        order_key: s.order_key,
        text: s.text,
        topics: [],
      }))
    };
  } catch (error) {
    console.error('Failed to fetch chapter data:', error);
    return null;
  }
}

export default async function TanyaChapterPage({
  params,
}: {
  params: Promise<{ perek: string }>;
}) {
  const { perek } = await params;

  const chapterData = await getChapterData(perek);

  if (!chapterData || chapterData.statements.length === 0) {
    notFound();
  }

  const paragraphText = chapterData.paragraphs.map((p: any) => p.text).join(' ');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <Breadcrumbs
          items={[
            { label: 'Seforim', href: '/seforim' },
            { label: 'Tanya – Likutei Amarim', href: '/seforim/3' },
            { label: `Perek ${perek}` },
          ]}
          className="mb-6"
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tanya – Likutei Amarim – Perek {perek}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Click a sentence to see related topics and sources.
          </p>
        </div>

        <TanyaChapterReader
          paragraphText={paragraphText}
          statements={chapterData.statements}
          topicsInPerek={[]}
          sources={[]}
        />
      </div>
    </div>
  );
}
