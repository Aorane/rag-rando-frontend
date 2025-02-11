import { SearchResponse } from '@/types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function searchHikes(query: string): Promise<SearchResponse> {
  try {
    console.log(`query:`, query);

    const response = await fetch(`http://127.0.0.1:8000/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    console.log(`response:`, response);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    throw error;
  }
} 