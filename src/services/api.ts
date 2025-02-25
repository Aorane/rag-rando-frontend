import { SearchResponse } from '@/types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function searchHikes(query: string): Promise<SearchResponse> {
  try {
    console.log(`query:`, query);

    // Encodage des paramètres dans l'URL
    const encodedQuery = encodeURIComponent(query);
    const url = `${API_BASE_URL}/api/search/?q=${encodedQuery}`;
    
    const response = await fetch(url, {
      method: 'GET',
      // Les en-têtes Content-Type et le corps ne sont plus nécessaires en GET
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