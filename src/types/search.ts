export interface SearchResponse {
  results: HikeResult[];
  messages: Message[];
  response: string;
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
  context: {
    // Nouveaux champs pour le contexte enrichi
    synthese?: string;
    conclusion?: string;
    recommandations?: HikeResult[];
    nombre_resultats?: number;
    criteres_recherche?: CriteresRecherche;
    analysis?: Analysis;
    // Autres propriétés existantes
    [key: string]: unknown;
  };
  search_params?: {
    semantic_text: string;
    location?: {
      lat: number;
      lon: number;
    } | string;
    distance?: number;
    filters?: Record<string, unknown>;
  };
  metadata: {
    total: number;
    time: number;
    params: Record<string, unknown>;
  };
}

// Interface pour les critères de recherche
export interface CriteresRecherche {
  semantic_text: string;
  location?: string;
  distance_max_from_location?: number;
  filters?: {
    pratique?: string;
    difficulte?: string;
    longueur?: {
      min?: number;
      max?: number;
    };
    themes?: string[];
  };
}

// Interface pour l'analyse de recherche
export interface Analysis {
  should_search: boolean;
  search_params: any;
  results_count: number;
}

/**
 * Type exporté pour représenter un résultat de randonnée.
 */
export interface HikeResult {
  id_local: string;
  nom_itineraire: string;
  nom?: string;
  description?: string;
  presentation?: string;
  presentation_courte?: string;
  geometry?: {
    type: string;
    coordinates: [number, number][]
  };
  duree: number;
  denivele_positif: number;
  denivele_negatif?: number;
  longueur?: number;
  longueur_km?: number;
  difficulte: string;
  pratique?: string;
  type_itineraire?: string;
  parcours?: string;
  themes?: string[];
  image?: string;
  commune?: string;
  communes_nom?: string[];
  depart?: string;
  arrivee?: string;
  saisons?: string[];
  accessible?: string[];
  accessibilite?: string[];
  parking_info?: string;
  transports_commun?: string;
  points_forts?: string[];
  points_interet?: string;
  altitude_max?: number;
  altitude_min?: number;
  altitudes?: {
    min: number;
    max: number;
  };
  gpx_url?: string;
  website_url?: string;
  // Permettre des champs supplémentaires
  [key: string]: any;
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

export interface MessageContent {
  response: string;
  synthese?: string;
  conclusion?: string;
  randonnees?: HikeResult[];
  recommandations?: HikeResult[];
  nombre_resultats?: number;
  criteres_recherche?: CriteresRecherche;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent;
} 