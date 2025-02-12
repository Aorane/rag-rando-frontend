export interface SearchResponse {
  interpreted_params: {
    semantic_text: string;
    location: {
      lat: number;
      lon: number;
    } | null;
    distance: number;
    filters: {
      longueur: number | { min: number; max: number } | null;
      difficulte: string | null;
      pratique: string | null;
      note_minimum: number | null;
      accessibilite: {
        pmr: boolean | null;
        poussette: boolean | null;
      };
      saison: string | null;
    };
  };
  results: HikeResult[];
  llm_response: LLMResponse;
}

/**
 * Type exporté pour représenter un résultat de randonnée.
 */
export interface HikeResult {
  id_local: string;
  nom_itineraire: string;
  presentation: string;
  presentation_courte?: string;
  longueur: number;
  difficulte: string;
  pratique: string;
  score: number;
  
  // Informations géographiques
  depart: string;
  arrivee: string;
  type_itineraire?: string;
  coordonnees_depart?: { lat: number; lon: number };
  coordonnees_arrivee?: { lat: number; lon: number };
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  communes_nom?: string;
  
  // Caractéristiques techniques
  balisage?: string;
  denivele_positif: number;
  denivele_negatif?: number;
  altitude_min?: number;
  altitude_max?: number;
  duree?: number;
  type_sol?: string;
  
  // Informations pratiques
  points_interet?: any[];
  accessibilite?: {
    pmr: boolean;
    poussette: boolean;
    niveau_difficulte_acces?: string;
  };
  note_moyenne?: number;
  nombre_avis?: number;
  parking_info?: string;
  parking_geometrie?: any;
  acces_routier?: string;
  transports_commun?: string;
  
  // Recommandations
  saison_recommandee?: string;
  equipements_recommandes?: string[];
  themes?: string;
  recommandations?: string;
  
  // Médias
  medias?: Array<{
    titre?: string;
    legende?: string;
    type: string;
    url: string;
    auteur?: string;
    licence?: string;
  }>;
}

// Ajout du type pour la nouvelle structure LLM
export interface LLMResponse {
  summary: {
    title: string;
    interpretation: string;
    results_count: string;
  };
  analysis: {
    main_points: string[];
    suggestions: string[];
  };
  highlights: {
    id: string;
    text: string;
  }[];
} 