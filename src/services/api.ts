import { SearchResponse, Message } from '@/types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function searchHikes(query: string, messages: Message[] = [], context: any = {}): Promise<SearchResponse> {
  try {
    console.log(`query:`, query);
    console.log(`messages:`, messages);

    // Avec l'API stateless, on envoie tout l'historique et le contexte à chaque fois
    const payload = {
      query,
      messages,
      context
    };
    
    const response = await fetch(`${API_BASE_URL}/api/talk/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`response:`, response);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Conversion de la réponse API au format attendu par notre UI
    return {
      results: data.search_results || [],
      messages: data.messages,
      response: data.response,
      context: data.context,
      map_data: data.map_data,
      metadata: {
        total: data.search_results?.length || 0,
        time: 0,
        params: {}
      }
    };
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    throw error;
  }
}

// export async function searchHikes(query: string): Promise<SearchResponse> {
//   try {
//     console.log(`query:`, query);

//     // Encodage des paramètres dans l'URL
//     const encodedQuery = encodeURIComponent(query);
//     const url = `${API_BASE_URL}/api/search/?q=${encodedQuery}`;
    
//     const response = await fetch(url, {
//       method: 'GET',
//       // Les en-têtes Content-Type et le corps ne sont plus nécessaires en GET
//     });
    
//     console.log(`response:`, response);

//     if (!response.ok) {
//       throw new Error(`Erreur HTTP: ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Erreur lors de la recherche:', error);
//     throw error;
//   }
// }