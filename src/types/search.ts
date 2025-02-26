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
  description?: string;
  geometry: {
    type: string;
    coordinates: [number, number][]
  };
  duree: number;
  denivele_positif: number;
  denivele_negatif?: number;
  longueur: number;
  difficulte: string;
  pratique?: string;
  parcours?: 'Boucle' | 'Aller-retour' | 'Itinérance' | string;
  themes?: string[];
  image?: string;
  commune?: string;
  depart?: string;
  arrivee?: string;
  saisons?: string[];
  accessible?: string[];
  altitudes?: {
    min: number;
    max: number;
  };
  gpx_url?: string;
  website_url?: string;
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
  role: 'user' | 'assistant' | 'system';
  content: any;
} 