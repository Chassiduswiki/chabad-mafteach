import { redirect } from 'next/navigation';
import { createClient } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export default async function TanyaRedirectPage() {
  try {
    const directus = createClient();

    // Find the Tanya document by title
    const tanyaDocs = await directus.request(readItems('documents', {
      filter: {
        title: { _eq: 'ליקוטי אמרים' },
        doc_type: { _eq: 'sefer' }
      },
      fields: ['id'],
      limit: 1
    })) as any[];

    if (tanyaDocs && tanyaDocs.length > 0) {
      const tanyaId = tanyaDocs[0].id;
      redirect(`/seforim/${tanyaId}`);
    }

    // If not found, redirect to main seforim page
    redirect('/seforim');
  } catch (error) {
    console.error('Error finding Tanya document:', error);
    redirect('/seforim');
  }
}
