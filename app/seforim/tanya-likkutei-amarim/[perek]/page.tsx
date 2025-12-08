import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Topic } from '@/lib/directus';
import { TanyaChapterReader } from '@/components/tanya/TanyaChapterReader';

interface StatementWithTopics {
  id: number;
  order_key: string;
  text: string;
  topics: Topic[];
}

async function getTanyaChapter(perek: string) {
  // For now, this reader is only implemented for Perek 1.
  if (perek !== '1') return null;

  // 1) Find the Tanya document (seeded with this exact title)
  const docs = await directus.request(
    readItems('documents' as any, {
      filter: { title: { _eq: 'Tanya – Likutei Amarim' } },
      limit: 1,
    } as any)
  );

  if (!docs || (docs as any[]).length === 0) return null;
  const doc = (docs as any[])[0];

  // 2) Find the paragraph for Perek 1
  const paragraphs = await directus.request(
    readItems('paragraphs' as any, {
      filter: { doc_id: { _eq: doc.id }, order_key: { _eq: '1:000' } },
      limit: 1,
    } as any)
  );

  if (!paragraphs || (paragraphs as any[]).length === 0) return null;
  const paragraph = (paragraphs as any[])[0];

  // 3) Load statements for this paragraph
  const statements = await directus.request(
    readItems('statements' as any, {
      filter: { paragraph_id: { _eq: paragraph.id } },
      sort: ['order_key'],
    } as any)
  );

  const statementIds = (statements as any[]).map((s) => s.id);
  if (statementIds.length === 0) {
    return { doc, paragraph, statements: [], topicsById: {}, sources: [], sourceLinks: [] };
  }

  // 4) Load statement_topics for these statements
  const statementTopics = await directus.request(
    readItems('statement_topics' as any, {
      filter: { statement_id: { _in: statementIds } },
      limit: -1,
    } as any)
  );

  const topicIds = Array.from(new Set((statementTopics as any[]).map((st) => st.topic_id)));

  // 5) Load topics
  const topics = topicIds.length
    ? await directus.request(
        readItems('topics' as any, {
          filter: { id: { _in: topicIds } },
          limit: -1,
        } as any)
      )
    : [];

  const topicsById: Record<number, Topic> = {};
  (topics as any[]).forEach((t) => {
    topicsById[t.id as number] = {
      id: t.id,
      slug: t.slug,
      name: t.canonical_title,
      name_hebrew: undefined,
      name_transliteration: undefined,
      alternate_names: [],
      category: t.topic_type,
      definition_short: t.description,
      definition_positive: undefined,
      definition_negative: undefined,
      overview: undefined,
      article: undefined,
      practical_takeaways: undefined,
      common_confusions: [],
      key_concepts: [],
      historical_context: undefined,
      difficulty_level: undefined,
      estimated_read_time: undefined,
      view_count: undefined,
      is_published: undefined,
      meta_description: undefined,
    };
  });

  // 6) Load sources and source_links for these statements
  const sourceLinks = await directus.request(
    readItems('source_links' as any, {
      filter: { statement_id: { _in: statementIds } },
      limit: -1,
    } as any)
  );

  const sourceIds = Array.from(new Set((sourceLinks as any[]).map((sl) => sl.source_id)));
  const sources = sourceIds.length
    ? await directus.request(
        readItems('sources' as any, {
          filter: { id: { _in: sourceIds } },
          limit: -1,
        } as any)
      )
    : [];

  return { doc, paragraph, statements, statementTopics, topicsById, sources, sourceLinks };
}

export default async function TanyaChapterPage({
  params,
}: {
  params: Promise<{ perek: string }>;
}) {
  const { perek } = await params;

  const data = await getTanyaChapter(perek);
  if (!data) {
    notFound();
  }

  const { doc, paragraph, statements, statementTopics, topicsById, sources, sourceLinks } = data!;

  // Group topics by statement
  const topicsByStatement: Record<number, Topic[]> = {};
  (statementTopics as any[]).forEach((st) => {
    const topic = topicsById[st.topic_id as number];
    if (!topic) return;
    if (!topicsByStatement[st.statement_id as number]) topicsByStatement[st.statement_id as number] = [];
    topicsByStatement[st.statement_id as number].push(topic);
  });

  const statementsWithTopics: StatementWithTopics[] = (statements as any[]).map((s) => ({
    id: s.id,
    order_key: s.order_key,
    text: s.text,
    topics: topicsByStatement[s.id as number] || [],
  }));

  // Aggregate topics and sources for sidebar
  const uniqueTopics = Object.values(topicsById);
  const sourcesArray = (sources as any[]).map((s) => ({
    id: s.id as number,
    title: s.title as string,
    external_url: (s as any).external_url ?? null,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <Breadcrumbs
          items={[
            { label: 'Seforim', href: '/seforim' },
            { label: doc.title, href: '/seforim/3' },
            { label: `Perek ${perek}` },
          ]}
          className="mb-6"
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {doc.title} – Perek {perek}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Demo reader powered entirely by Directus (paragraphs, statements, topics, sources).
          </p>
        </div>

        <TanyaChapterReader
          paragraphText={paragraph.text as string}
          statements={statementsWithTopics}
          topicsInPerek={uniqueTopics}
          sources={sourcesArray}
        />
      </div>
    </div>
  );
}
