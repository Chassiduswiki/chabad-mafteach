import { getDirectus } from '@/lib/directus';
import { createItem, readItems, updateItem } from '@directus/sdk';

export interface TranslationHistoryRecord {
  id?: string;
  topic_id: string;
  source_language: string;
  target_language: string;
  field: string;
  translation: string;
  quality_score: number;
  quality_explanation: string;
  model: string;
  is_fallback: boolean;
  status: 'pending' | 'approved' | 'rejected';
  user_created?: string;
  date_created?: string;
}

export class TranslationHistoryService {
  private directus = getDirectus();

  async createRecord(data: Omit<TranslationHistoryRecord, 'id' | 'user_created' | 'date_created'>): Promise<TranslationHistoryRecord> {
    const result = await this.directus.request(
      createItem('translation_history', data)
    );
    return result as TranslationHistoryRecord;
  }

  async getRecordsByTopic(topicId: string, limit = 10): Promise<TranslationHistoryRecord[]> {
    const records = await this.directus.request(
      readItems('translation_history', {
        filter: { topic_id: { _eq: topicId } },
        sort: ['-date_created'],
        limit,
      })
    );
    return records as TranslationHistoryRecord[];
  }

  async getRecordsByField(topicId: string, field: string, targetLanguage: string): Promise<TranslationHistoryRecord[]> {
    const records = await this.directus.request(
      readItems('translation_history', {
        filter: {
          _and: [
            { topic_id: { _eq: topicId } },
            { field: { _eq: field } },
            { target_language: { _eq: targetLanguage } },
          ],
        },
        sort: ['-date_created'],
      })
    );
    return records as TranslationHistoryRecord[];
  }

  async approveTranslation(id: string): Promise<void> {
    await this.directus.request(
      updateItem('translation_history', id, { status: 'approved' })
    );
  }

  async rejectTranslation(id: string): Promise<void> {
    await this.directus.request(
      updateItem('translation_history', id, { status: 'rejected' })
    );
  }

  async getHighQualityTranslations(minScore = 0.8): Promise<TranslationHistoryRecord[]> {
    const records = await this.directus.request(
      readItems('translation_history', {
        filter: {
          _and: [
            { quality_score: { _gte: minScore } },
            { status: { _eq: 'approved' } },
          ],
        },
        sort: ['-quality_score', '-date_created'],
      })
    );
    return records as TranslationHistoryRecord[];
  }

  async getPendingTranslations(): Promise<TranslationHistoryRecord[]> {
    const records = await this.directus.request(
      readItems('translation_history', {
        filter: { status: { _eq: 'pending' } },
        sort: ['-date_created'],
      })
    );
    return records as TranslationHistoryRecord[];
  }

  async getTranslationStats(topicId?: string) {
    const filter = topicId ? { topic_id: { _eq: topicId } } : {};
    
    const allRecords = await this.directus.request(
      readItems('translation_history', {
        filter,
        fields: ['status', 'quality_score', 'is_fallback'],
      })
    );

    const stats = {
      total: allRecords.length,
      approved: allRecords.filter((r: any) => r.status === 'approved').length,
      pending: allRecords.filter((r: any) => r.status === 'pending').length,
      rejected: allRecords.filter((r: any) => r.status === 'rejected').length,
      averageQuality: allRecords.reduce((sum: number, r: any) => sum + r.quality_score, 0) / allRecords.length || 0,
      fallbackUsed: allRecords.filter((r: any) => r.is_fallback).length,
    };

    return stats;
  }
}

export const translationHistory = new TranslationHistoryService();
