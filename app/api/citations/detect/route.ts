import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, statement_id } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Use NLP service for citation recognition
    const nlpResponse = await fetch('http://localhost:8001/citation_recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!nlpResponse.ok) {
      // Fallback to basic pattern matching if NLP service unavailable
      const fallbackCitations = extractBasicCitations(text);
      return NextResponse.json({
        success: true,
        text_analyzed: text,
        citations_found: fallbackCitations.length,
        citations: fallbackCitations,
        source: 'fallback'
      });
    }

    const nlpResult = await nlpResponse.json();
    const citations = nlpResult.citations.map((cit: any) => ({
      text: cit.word || cit.entity_group,
      type: cit.entity_group,
      confidence: cit.score || 0.8,
      source: 'nlp'
    }));

    return NextResponse.json({
      success: true,
      text_analyzed: text,
      citations_found: citations.length,
      citations: citations
    });

  } catch (error) {
    console.error('Citation detection error:', error);
    // Fallback to basic extraction
    const { text } = await request.json();
    const fallbackCitations = extractBasicCitations(text || '');
    return NextResponse.json({
      success: true,
      text_analyzed: text,
      citations_found: fallbackCitations.length,
      citations: fallbackCitations,
      source: 'fallback'
    });
  }
}

/**
 * Basic citation extraction as fallback
 */
function extractBasicCitations(text: string) {
  const citations = [];
  // Look for common Jewish text patterns
  const patterns = [
    /(תניא|תורה אור|לקוטי תורה|שולחן ערוך)/g, // Common seforim
    /(ברכות|גיטין|כתובות)/g, // Talmud tractates
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      citations.push({
        text: match[0],
        type: 'text',
        confidence: 0.7,
        source: 'fallback'
      });
    }
  });

  return citations;
}
