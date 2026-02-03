import { NextRequest, NextResponse } from 'next/server';
import { formatCitationString } from '@/lib/citations/citationFormatter';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN;

/**
 * GET /api/sources/hierarchy
 *
 * Fetches hierarchical source data for the citation browser.
 *
 * Query params:
 *   - parent_id: Get children of a specific source (omit for root sources)
 *   - resolve: "vol,page" - Resolve a volume + page to a specific source
 *   - root_id: Required with resolve - the root source ID
 *
 * Examples:
 *   GET /api/sources/hierarchy
 *     → Returns all root sources (parent_id IS NULL, has children)
 *
 *   GET /api/sources/hierarchy?parent_id=256
 *     → Returns children of source 256 (e.g., volumes of Likkutei Sichos)
 *
 *   GET /api/sources/hierarchy?resolve=4,345&root_id=256
 *     → Resolves "Likkutei Sichos vol 4, page 345" to the specific sicha
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id');
  const resolve = searchParams.get('resolve');
  const rootId = searchParams.get('root_id');

  try {
    // Resolution mode: find source by volume + page
    if (resolve && rootId) {
      const [volNum, pageNum] = resolve.split(',').map(s => parseInt(s.trim()));

      if (isNaN(volNum) || isNaN(pageNum)) {
        return NextResponse.json(
          { error: 'Invalid resolve format. Use: resolve=<volume>,<page>' },
          { status: 400 }
        );
      }

      // First, find the volume
      const volumesRes = await fetch(
        `${DIRECTUS_URL}/items/sources?filter[parent_id][_eq]=${rootId}&fields=id,title,metadata&limit=100`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );

      if (!volumesRes.ok) {
        throw new Error('Failed to fetch volumes');
      }

      const volumesData = await volumesRes.json();
      const volumes = volumesData.data || [];

      // Find the volume matching the number
      const targetVolume = volumes.find((v: any) => {
        const volMatch = v.metadata?.volume_number;
        if (volMatch) return volMatch === volNum;
        // Fallback: extract from title
        const titleMatch = v.title.match(/([א-ת]+)\s*$/);
        if (titleMatch) {
          const hebrewNum = parseHebrewNumeral(titleMatch[1]);
          return hebrewNum === volNum;
        }
        return false;
      });

      if (!targetVolume) {
        return NextResponse.json({
          resolved: false,
          error: `Volume ${volNum} not found`,
          volumes: volumes.map((v: any) => ({ id: v.id, title: v.title }))
        });
      }

      // Now find the sicha at that page
      const sichasRes = await fetch(
        `${DIRECTUS_URL}/items/sources?filter[parent_id][_eq]=${targetVolume.id}&filter[page_number][_lte]=${pageNum}&fields=id,title,page_number,page_count,parsha,external_url&sort=-page_number&limit=1`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );

      if (!sichasRes.ok) {
        throw new Error('Failed to fetch sichas');
      }

      const sichasData = await sichasRes.json();
      const sichas = sichasData.data || [];

      if (sichas.length === 0) {
        return NextResponse.json({
          resolved: false,
          error: `No source found at page ${pageNum} in volume ${volNum}`,
          volume: { id: targetVolume.id, title: targetVolume.title }
        });
      }

      const sicha = sichas[0];

      // Verify the page falls within this sicha's range
      const endPage = sicha.page_number + (sicha.page_count || 1) - 1;
      const inRange = pageNum >= sicha.page_number && pageNum <= endPage;

      // Generate formatted citation
      const formattedTitle = formatCitationString({
        id: sicha.id,
        title: sicha.title,
        page_number: sicha.page_number,
        page_count: sicha.page_count,
        parsha: sicha.parsha,
        rootSourceId: 256,
        volumeTitle: targetVolume.title,
      });

      return NextResponse.json({
        resolved: true,
        source: {
          id: sicha.id,
          title: sicha.title,
          formatted_title: formattedTitle,
          page_number: sicha.page_number,
          page_count: sicha.page_count,
          page_range: `${sicha.page_number}-${endPage}`,
          parsha: sicha.parsha,
          external_url: sicha.external_url,
          volume: { id: targetVolume.id, title: targetVolume.title },
          requested_page: pageNum,
          page_in_range: inRange
        }
      });
    }

    // Hierarchy browsing mode
    let filter = '';

    if (parentId) {
      // Get children of specific parent
      filter = `filter[parent_id][_eq]=${parentId}`;
    } else {
      // Get root sources (parent_id IS NULL and likely has children)
      filter = 'filter[parent_id][_null]=true';
    }

    const response = await fetch(
      `${DIRECTUS_URL}/items/sources?${filter}&fields=id,title,parent_id,external_url,external_system,page_number,page_count,parsha,metadata,author_id&sort=page_number,title&limit=500`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (!response.ok) {
      throw new Error(`Directus error: ${response.status}`);
    }

    const data = await response.json();
    const sources = data.data || [];

    // For root sources, check which ones have children (are "browsable")
    if (!parentId) {
      // Get counts of children for each root source
      const rootIds = sources.map((s: any) => s.id);

      if (rootIds.length > 0) {
        const childCountRes = await fetch(
          `${DIRECTUS_URL}/items/sources?filter[parent_id][_in]=${rootIds.join(',')}&aggregate[count]=id&groupBy[]=parent_id`,
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        if (childCountRes.ok) {
          const childCountData = await childCountRes.json();
          const counts = childCountData.data || [];
          const countMap = new Map(counts.map((c: any) => [c.parent_id, c.count.id]));

          // Filter to only sources with children and add child_count + formatted_title
          const browsableSources = sources
            .filter((s: any) => countMap.has(s.id))
            .map((s: any) => addFormattedTitle({
              ...s,
              child_count: countMap.get(s.id),
              is_browsable: true
            }));

          return NextResponse.json({
            data: browsableSources,
            level: 'root',
            total: browsableSources.length
          });
        }
      }
    }

    // For non-root, check if each item has children
    const sourceIds = sources.map((s: any) => s.id);

    if (sourceIds.length > 0) {
      const childCheckRes = await fetch(
        `${DIRECTUS_URL}/items/sources?filter[parent_id][_in]=${sourceIds.join(',')}&aggregate[count]=id&groupBy[]=parent_id`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );

      if (childCheckRes.ok) {
        const childCheckData = await childCheckRes.json();
        const counts = childCheckData.data || [];
        const countMap = new Map(counts.map((c: any) => [c.parent_id, c.count.id]));

        const enrichedSources = sources.map((s: any) => addFormattedTitle({
          ...s,
          child_count: countMap.get(s.id) || 0,
          is_browsable: countMap.has(s.id),
          is_leaf: !countMap.has(s.id)
        }));

        return NextResponse.json({
          data: enrichedSources,
          parent_id: parentId ? parseInt(parentId) : null,
          level: parentId ? 'children' : 'root',
          total: enrichedSources.length
        });
      }
    }

    return NextResponse.json({
      data: sources.map((s: any) => addFormattedTitle(s)),
      parent_id: parentId ? parseInt(parentId) : null,
      level: parentId ? 'children' : 'root',
      total: sources.length
    });

  } catch (error) {
    console.error('Hierarchy API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hierarchy', details: String(error) },
      { status: 500 }
    );
  }
}

// Add formatted title to a source object
function addFormattedTitle(source: any, volumeTitle?: string): any {
  const formattedTitle = formatCitationString({
    id: source.id,
    title: source.title,
    page_number: source.page_number,
    page_count: source.page_count,
    parsha: source.parsha,
    metadata: source.metadata,
    rootSourceId: source.metadata?.type === 'sicha' ? 256 : undefined,
    volumeTitle,
  });

  return {
    ...source,
    formatted_title: formattedTitle,
  };
}

// Hebrew numeral parsing helper
function parseHebrewNumeral(text: string): number {
  const HEBREW_NUMERALS: Record<string, number> = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'יא': 11, 'יב': 12, 'יג': 13, 'יד': 14, 'טו': 15, 'טז': 16,
    'יז': 17, 'יח': 18, 'יט': 19, 'כ': 20, 'כא': 21, 'כב': 22, 'כג': 23,
    'כד': 24, 'כה': 25, 'כו': 26, 'כז': 27, 'כח': 28, 'כט': 29, 'ל': 30,
    'לא': 31, 'לב': 32, 'לג': 33, 'לד': 34, 'לה': 35, 'לו': 36, 'לז': 37,
    'לח': 38, 'לט': 39, 'מ': 40
  };
  return HEBREW_NUMERALS[text] || 999;
}
