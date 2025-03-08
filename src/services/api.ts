import { SearchResponse, Message, HikeResult, Coordinates } from '@/types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function searchHikes(query: string, messages: Message[] = [], resultats: HikeResult[] = []): Promise<SearchResponse> {
  try {
    console.log(`query:`, query);
    console.log(`messages:`, messages);

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
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    // Traiter les résultats si présents
    const processedResults = (data.resultats || []).map((rando: any): HikeResult => {
      // Conversion des coordonnées
      const coordonnees_depart: Coordinates | undefined = rando.coordonnees_depart ? {
        lat: rando.coordonnees_depart.lat,
        lon: rando.coordonnees_depart.lon
      } : undefined;

      const coordonnees_arrivee: Coordinates | undefined = rando.coordonnees_arrivee ? {
        lat: rando.coordonnees_arrivee.lat,
        lon: rando.coordonnees_arrivee.lon
      } : undefined;

      // Traitement des médias
      const medias = Array.isArray(rando.medias) ? rando.medias.map((media: any) => ({
        titre: media.titre,
        legende: media.legende,
        type: media.type,
        url: media.url,
        auteur: media.auteur,
        licence: media.licence
      })) : undefined;

      // Construction de l'objet randonnée
      return {
        // Identifiants et métadonnées
        id_local: rando.id_local,
        producteur: rando.producteur,
        uuid: rando.uuid,
        url: rando.url,

        // Informations principales
        nom_itineraire: rando.nom_itineraire || rando.nom,
        presentation: rando.presentation || '',
        presentation_courte: rando.presentation_courte,
        instructions: rando.instructions || '',

        // Caractéristiques techniques
        longueur: parseFloat(rando.longueur) || 0,
        duree: parseFloat(rando.duree) || 0,
        difficulte: rando.difficulte || 'Non spécifiée',
        pratique: rando.pratique || 'pédestre',
        type_itineraire: rando.type_itineraire,
        balisage: rando.balisage,

        // Informations géographiques
        depart: rando.depart || '',
        arrivee: rando.arrivee || '',
        communes_nom: rando.communes_nom,
        communes_code: rando.communes_code,
        geometry: rando.geometry,
        coordonnees_depart,
        coordonnees_arrivee,

        // Dénivelés et altitudes
        denivele_positif: parseFloat(rando.denivele_positif) || 0,
        denivele_negatif: parseFloat(rando.denivele_negatif) || 0,
        altitude_max: parseFloat(rando.altitude_max),
        altitude_min: parseFloat(rando.altitude_min),

        // Informations pratiques
        points_interet: Array.isArray(rando.points_interet) ? rando.points_interet : [],
        accessibilite: rando.accessibilite ? {
          pmr: !!rando.accessibilite.pmr,
          poussette: !!rando.accessibilite.poussette,
          niveau_difficulte_acces: rando.accessibilite.niveau_difficulte_acces || ''
        } : undefined,
        acces_routier: rando.acces_routier,
        transports_commun: rando.transports_commun,
        parking_info: rando.parking_info,
        parking_geometrie: rando.parking_geometrie,

        // Recommandations
        themes: Array.isArray(rando.themes) ? rando.themes : [],
        recommandations: rando.recommandations,
        saison_recommandee: rando.saison_recommandee,
        equipements_recommandes: Array.isArray(rando.equipements_recommandes) ? 
          rando.equipements_recommandes : [],

        // Médias
        medias,

        // Informations complémentaires
        type_sol: rando.type_sol,
        note_moyenne: parseFloat(rando.note_moyenne) || undefined,
        nombre_avis: parseInt(rando.nombre_avis) || undefined,

        // Dates
        date_creation: rando.date_creation,
        date_modification: rando.date_modification,

        // PDIPR
        pdipr_inscription: !!rando.pdipr_inscription,
        pdipr_date_inscription: rando.pdipr_date_inscription
      };
    });

    // Extraire les informations de la dernière réponse de l'assistant
    const lastMessage = data.messages[data.messages.length - 1];
    const assistantContent = typeof lastMessage.content === 'object' ? lastMessage.content : { response: lastMessage.content };
    
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