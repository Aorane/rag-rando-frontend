import { SearchResponse, Message, HikeResult } from '@/types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function searchHikes(query: string, messages: Message[] = [], resultats: HikeResult[] = []): Promise<SearchResponse> {
  try {
    console.log(`query:`, query);
    console.log(`messages:`, messages);

    // Avec l'API stateless, on envoie tout l'historique à chaque fois
    const payload = {
      messages,
      resultats
    };
    
    const response = await fetch(`${API_BASE_URL}/conversation/`, {
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
    console.log('API response data:', data);
    
    // Traiter les résultats si présents
    const processedResults = (data.resultats || []).map((rando: any): HikeResult => {
      return {
        id_local: rando.id_local,
        nom_itineraire: rando.nom_itineraire || rando.nom,
        longueur: rando.longueur,
        difficulte: rando.difficulte,
        duree: rando.duree,
        geometry: rando.geometry,
        denivele_positif: rando.denivele_positif,
        denivele_negatif: rando.denivele_negatif,
        presentation: rando.presentation,
        presentation_courte: rando.presentation_courte,
        points_forts: Array.isArray(rando.points_forts) ? rando.points_forts : [],
        themes: Array.isArray(rando.themes) ? rando.themes : [],
        pratique: rando.pratique,
        type_itineraire: rando.type_itineraire,
        altitude_max: rando.altitude_max,
        medias: rando.medias,
        url_details: rando.url_details,
        transports_commun: rando.transports_commun
      };
    });
    console.log('API processedResults data:', processedResults);

    // Extraire les informations de la dernière réponse de l'assistant
    const lastMessage = data.messages[data.messages.length - 1];
    const assistantContent = typeof lastMessage.content === 'object' ? lastMessage.content : { response: lastMessage.content };
    
    // Conversion de la réponse API au format attendu par notre UI
    return {
      results: processedResults,
      messages: data.messages,
      response: assistantContent.response || '',
      context: {
        synthese: assistantContent.synthese || '',
        conclusion: assistantContent.conclusion || ''
      },
      metadata: {
        total: processedResults.length,
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