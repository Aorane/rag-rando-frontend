export interface SearchResponse {
  results: HikeResult[];
  messages: Message[];
  response: {
    summary: {
      title: string;
      interpretation: string;
      comparaison?: string;
      results_count?: string | number;
    };
    analysis: {
      main_points: string[];
      suggestions: string[];
    };
    highlights: {
      id: string;
      text: string;
    }[];
  } | string;
  map_data?: {
    type: string;
    features: Array<{
      type: string;
      geometry: {
        type: string;
        coordinates: number[][];
      };
      properties: Record<string, unknown>;
    }>;
  };
  context: Record<string, unknown>;
  search_params?: {
    semantic_text: string;
    location?: {
      lat: number;
      lon: number;
    };
    distance?: number;
    filters?: Record<string, unknown>;
  };
  metadata: {
    total: number;
    time: number;
    params: Record<string, unknown>;
  };
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
  instructions: string;
  
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
  points_interet?: string[];
  accessibilite?: {
    pmr: boolean;
    poussette: boolean;
    niveau_difficulte_acces?: string;
  };
  note_moyenne?: number;
  nombre_avis?: number;
  parking_info?: string;
  parking_geometrie?: {
    type: string;
    coordinates: [number, number][];
  };
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
    type_media?: string;
  }>;
}

// Ajout du type pour la nouvelle structure LLM
export type LLMResponse = {
  summary: {
    title: string;
    interpretation: string;
    comparaison: string;
    results_count: number;
  },
  analysis: {
    main_points: string[];
    suggestions: string[];
    recommendations: string[];
  },
  highlights: {
    id: string;
    text: string;
  }[];
};

export interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp?: string;
} 