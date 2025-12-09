import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BookReader } from '@/components/tanya/BookReader';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function getChapterData(perek: string) {
  try {
    console.log('Fetching paragraphs for perek:', perek);
    // Find paragraphs for this chapter (order_key starts with perek number)
    const paragraphs = await directus.request(readItems('paragraphs', {
      fields: ['id', 'order_key', 'text'],
      sort: ['order_key'],
      limit: 10
    })) as any[];

    console.log('All paragraphs sample:', paragraphs.slice(0, 3).map(p => ({ id: p.id, order_key: p.order_key })));

    // Filter for this perek
    const perekParagraphs = paragraphs.filter(p => p.order_key.startsWith(perek) || p.order_key.startsWith(`${perek}.`));

    console.log('Filtered paragraphs for perek:', perekParagraphs.length);

    if (!perekParagraphs || perekParagraphs.length === 0) {
      return null;
    }

    // Get statements for these paragraphs
    const paragraphIds = perekParagraphs.map(p => p.id);
    console.log('Fetching statements for paragraph IDs:', paragraphIds);
    const statements = await directus.request(readItems('statements', {
      filter: {
        paragraph_id: { _in: paragraphIds }
      } as any,
      fields: ['id', 'order_key', 'text', 'paragraph_id'],
      sort: ['order_key']
    })) as any[];

    console.log('Found statements:', statements.length);

    // Get source links for these statements
    const statementIds = statements.map(s => s.id);
    let sourceLinks: any[] = [];
    if (statementIds.length > 0) {
      try {
        sourceLinks = await directus.request(readItems('source_links', {
          filter: {
            statement_id: { _in: statementIds }
          } as any,
          fields: [
            'id', 'relationship_type', 'page_number', 'verse_reference', 'section_reference',
            'statement_id', 
            { source_id: ['id', 'title', 'external_url', 'citation_text'] }
          ]
        })) as any[];
      } catch (error) {
        console.warn('Failed to fetch source_links:', error);
        // Continue with empty sourceLinks
      }
    }

    // Group source links by statement
    const sourcesByStatement: Record<number, any[]> = {};
    sourceLinks.forEach(link => {
      const statementId = link.statement_id;
      if (!sourcesByStatement[statementId]) {
        sourcesByStatement[statementId] = [];
      }
      sourcesByStatement[statementId].push({
        id: link.source_id.id,
        title: link.source_id.title,
        external_url: link.source_id.external_url,
        relationship_type: link.relationship_type,
        page_number: link.page_number,
        verse_reference: link.verse_reference,
        section_reference: link.section_reference
      });
    });

    return {
      paragraphs: perekParagraphs,
      statements: statements.map((s, index) => ({
        id: s.id,
        order_key: s.order_key,
        text: s.text,
        topics: [],
        sources: sourcesByStatement[s.id] || []
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

        <Suspense fallback={<div>Loading chapter...</div>}>
          <TanyaChapterContent perek={perek} />
        </Suspense>
      </div>
    </div>
  );
}

async function TanyaChapterContent({ perek }: { perek: string }) {
  const chapterData = await getChapterData(perek);
  const currentPerek = parseInt(perek);

  if (!chapterData || chapterData.statements.length === 0) {
    notFound();
  }

  const paragraphText = chapterData.paragraphs.map((p: any) => p.text).join(' ');

  return (
    <BookReader
      paragraphText={paragraphText}
      statements={chapterData.statements}
      topicsInPerek={[]}
      sources={[]}
      currentPerek={currentPerek}
      totalPerek={10}
      isLoading={false}
    />
  );
}
