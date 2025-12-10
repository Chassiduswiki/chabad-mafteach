import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { requireEditor } from '@/lib/auth';

export const POST = requireEditor(async (
  request: NextRequest,
  context: { userId: string; role: string }
) => {
  // Update paragraph content and trigger version control
  async function updateParagraph(directus: any, documentId: string, paragraphId: string, content: string, userId: string) {
    // Create paragraph version before updating
    const currentParagraph = await directus.items('paragraphs').readOne(paragraphId);

    await directus.items('paragraph_versions').createOne({
      paragraph_id: paragraphId,
      version_number: Date.now(), // Simple versioning
      text: currentParagraph.text,
      change_type: 'content_edited',
      change_summary: 'Edited via smart editor',
      created_by: userId
    });

    // Update paragraph
    await directus.items('paragraphs').updateOne(paragraphId, {
      text: content,
      status: 'draft', // Reset to draft when edited
      updated_by: userId
    });

    return NextResponse.json({
      success: true,
      message: 'Paragraph updated successfully'
    });
  }

  // Create statements from paragraph using AI
  async function createStatementsFromParagraph(directus: any, paragraphId: string, userId: string) {
    const paragraph = await directus.items('paragraphs').readOne(paragraphId, {
      fields: ['id', 'text', 'original_lang', 'doc_id']
    });

    if (!paragraph) {
      return NextResponse.json(
        { error: 'Paragraph not found' },
        { status: 404 }
      );
    }

    // Use AI to break paragraph into statements
    // This would call the existing statement breaking API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/statements/break`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include auth headers
      },
      body: JSON.stringify({
        paragraph_id: parseInt(paragraphId),
        document_id: paragraph.doc_id
      })
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      statements_created: result.statements_created,
      statements: result.statements
    });
  }

  // Update individual statement
  async function updateStatement(directus: any, statementId: string, content: string, userId: string) {
    // Create version before update
    const currentStatement = await directus.items('statements').readOne(statementId);

    await directus.items('statement_versions').createOne({
      statement_id: statementId,
      version_number: Date.now(),
      text: currentStatement.text,
      change_type: 'text_edited',
      created_by: userId
    });

    // Update statement
    await directus.items('statements').updateOne(statementId, {
      text: content,
      status: 'draft',
      updated_by: userId
    });

    return NextResponse.json({
      success: true,
      message: 'Statement updated successfully'
    });
  }

  // Link statement to topics with relevance scores
  async function linkStatementTopics(directus: any, statementId: string, topics: any[], userId: string) {
    // Remove existing topic links
    await directus.items('statement_topics').deleteByQuery({
      filter: { statement_id: { _eq: statementId } }
    });

    // Create new topic links
    const topicLinks = topics.map((topic: any) => ({
      statement_id: statementId,
      topic_id: topic.id,
      relevance_score: topic.relevance_score || 0.8,
      is_primary: topic.is_primary || false,
      created_by: userId
    }));

    await directus.items('statement_topics').createMany(topicLinks);

    return NextResponse.json({
      success: true,
      message: `Linked to ${topicLinks.length} topics`
    });
  }

  // Save complete document with version control
  async function saveDocumentVersion(directus: any, documentId: string, userId: string) {
    // Get current document state
    const document = await directus.items('documents').readOne(documentId, {
      fields: ['*', 'paragraphs.statements.*']
    });

    // Create document version
    await directus.items('document_versions').createOne({
      document_id: documentId,
      version_number: Date.now(),
      title: document.title,
      change_type: 'content_edited',
      change_summary: 'Saved via smart editor',
      created_by: userId
    });

    // Update document status
    await directus.items('documents').updateOne(documentId, {
      status: 'reviewed',
      updated_by: userId
    });

    return NextResponse.json({
      success: true,
      message: 'Document saved with version control'
    });
  }

  try {
    const { action, documentId, paragraphId, content, statementId } = await request.json();

    const directus = createClient();

    switch (action) {
      case 'update_paragraph':
        return await updateParagraph(directus, documentId, paragraphId, content, context.userId);

      case 'create_statements':
        return await createStatementsFromParagraph(directus, paragraphId, context.userId);

      case 'update_statement':
        return await updateStatement(directus, statementId, content, context.userId);

      case 'link_topics':
        return await linkStatementTopics(directus, statementId, content.topics, context.userId);

      case 'save_document':
        return await saveDocumentVersion(directus, documentId, context.userId);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Smart editor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
