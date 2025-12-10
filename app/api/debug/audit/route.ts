import { NextRequest, NextResponse } from 'next/server';
import directus from '@/lib/directus';
import { readItems, deleteItems } from '@directus/sdk';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'audit_statement_topics') {
            // Get all statement_topics
            const statementTopics = await directus.request(readItems('statement_topics', {
                fields: ['id', 'statement_id', 'topic_id'],
                limit: -1
            }));

            // Get all valid statement IDs
            const statements = await directus.request(readItems('statements', {
                fields: ['id'],
                limit: -1
            }));

            const validStatementIds = new Set(statements.map(s => s.id));

            // Find orphaned records
            const orphanedRecords = statementTopics.filter(st =>
                st.statement_id && !validStatementIds.has(st.statement_id)
            );

            // Get all valid topic IDs
            const topics = await directus.request(readItems('topics', {
                fields: ['id'],
                limit: -1
            }));

            const validTopicIds = new Set(topics.map(t => t.id));

            // Find invalid topic references
            const invalidTopicRefs = statementTopics.filter(st =>
                st.topic_id && !validTopicIds.has(st.topic_id)
            );

            return NextResponse.json({
                total_statement_topics: statementTopics.length,
                total_statements: statements.length,
                total_topics: topics.length,
                orphaned_records: orphanedRecords.map(r => ({
                    id: r.id,
                    statement_id: r.statement_id,
                    topic_id: r.topic_id
                })),
                invalid_topic_refs: invalidTopicRefs.map(r => ({
                    id: r.id,
                    statement_id: r.statement_id,
                    topic_id: r.topic_id
                })),
                issues_found: orphanedRecords.length + invalidTopicRefs.length
            });
        }

        if (action === 'test_permissions') {
            try {
                // Test read permissions
                const statementTopics = await directus.request(readItems('statement_topics', {
                    limit: 1
                }));

                // Test if we can get the structure
                return NextResponse.json({
                    can_read_statement_topics: true,
                    sample_record: statementTopics[0] || null,
                    delete_available: typeof deleteItems !== 'undefined'
                });
            } catch (readError) {
                return NextResponse.json({
                    can_read_statement_topics: false,
                    read_error: readError instanceof Error ? readError.message : String(readError)
                });
            }
        }

        if (action === 'cleanup_statement_topics') {
            let orphanedRecords: any[] = [];
            try {
                console.log('Starting cleanup process...');

                // Get all statement_topics
                console.log('Fetching statement_topics...');
                const statementTopics = await directus.request(readItems('statement_topics', {
                    fields: ['id', 'statement_id', 'topic_id'],
                    limit: -1
                }));
                console.log(`Found ${statementTopics.length} statement_topics`);

                // Get all valid statement IDs
                console.log('Fetching statements...');
                const statements = await directus.request(readItems('statements', {
                    fields: ['id'],
                    limit: -1
                }));
                console.log(`Found ${statements.length} statements`);

                const validStatementIds = new Set(statements.map(s => s.id));
                console.log('Valid statement IDs:', Array.from(validStatementIds));

                // Find orphaned records
                orphanedRecords = statementTopics.filter(st =>
                    st.statement_id && !validStatementIds.has(st.statement_id)
                );
                console.log(`Found ${orphanedRecords.length} orphaned records:`, orphanedRecords);

                if (orphanedRecords.length === 0) {
                    return NextResponse.json({
                        message: 'No orphaned records found to clean',
                        cleaned_count: 0
                    });
                }

                // Delete orphaned records one by one
                const orphanedIds = orphanedRecords.map(r => r.id);
                console.log('Attempting to delete orphaned IDs one by one:', orphanedIds);

                let deletedCount = 0;
                const failedDeletes: number[] = [];

                for (const id of orphanedIds) {
                    try {
                        console.log(`Deleting record ${id}...`);
                        await directus.request(deleteItems('statement_topics', id));
                        deletedCount++;
                        console.log(`Successfully deleted record ${id}`);
                    } catch (singleDeleteError) {
                        console.error(`Failed to delete record ${id}:`, singleDeleteError);
                        failedDeletes.push(id);
                    }
                }

                console.log(`Successfully deleted ${deletedCount} records, failed ${failedDeletes.length}`);

                if (failedDeletes.length > 0) {
                    return NextResponse.json({
                        message: `Partially cleaned: ${deletedCount} records deleted, ${failedDeletes.length} failed`,
                        cleaned_records: orphanedRecords.filter(r => !failedDeletes.includes(r.id)).map(r => ({
                            id: r.id,
                            statement_id: r.statement_id,
                            topic_id: r.topic_id
                        })),
                        failed_deletes: failedDeletes,
                        cleaned_count: deletedCount,
                        total_attempted: orphanedIds.length
                    });
                }

                return NextResponse.json({
                    message: `Successfully cleaned ${orphanedIds.length} orphaned records`,
                    cleaned_records: orphanedRecords.map(r => ({
                        id: r.id,
                        statement_id: r.statement_id,
                        topic_id: r.topic_id
                    })),
                    cleaned_count: orphanedIds.length
                });
            } catch (cleanupError) {
                console.error('Cleanup error details:', cleanupError);
                console.error('Error type:', typeof cleanupError);
                console.error('Error keys:', Object.keys(cleanupError || {}));
                const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
                return NextResponse.json({
                    error: 'Failed to cleanup orphaned records',
                    details: cleanupMessage,
                    orphaned_count: orphanedRecords?.length || 0
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Debug API error:', error);
        console.error('Error type:', typeof error);
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Failed to run debug action', details: errorMessage }, { status: 500 });
    }
}
