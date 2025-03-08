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
    synthese: string;
    conclusion: string;
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
    params: any;
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
  // Identifiants et métadonnées
  id_local: string;
  producteur?: string;
  uuid?: string;
  url?: string;
  
  // Informations principales
  nom_itineraire: string;
  presentation: string;
  presentation_courte?: string;
  instructions: string;
  
  // Caractéristiques techniques
  longueur: number;
  duree: number;
  difficulte: string;
  pratique: 'pédestre' | 'trail' | 'VTT' | 'cyclo' | 'gravel' | 'équestre' | 'ski de fond' | 'ski de rando' | 'raquettes' | 'autre';
  type_itineraire?: 'aller-retour' | 'boucle' | 'aller simple' | 'itinérance' | 'étape';
  balisage?: string;
  
  // Informations géographiques
  depart: string;
  arrivee: string;
  communes_nom?: string;
  communes_code?: string;
  geometry: any; // GeoJSON
  coordonnees_depart?: Coordinates;
  coordonnees_arrivee?: Coordinates;
  
  // Dénivelés et altitudes
  denivele_positif?: number;
  denivele_negatif?: number;
  altitude_max?: number;
  altitude_min?: number;
  
  // Informations pratiques
  points_interet?: string[];
  accessibilite?: Accessibilite;
  acces_routier?: string;
  transports_commun?: string;
  parking_info?: string;
  parking_geometrie?: any;
  
  // Recommandations
  themes?: string | string[];
  recommandations?: string;
  saison_recommandee?: string;
  equipements_recommandes?: string[];
  
  // Médias
  medias?: Media[];
  
  // Informations complémentaires
  type_sol?: string;
  note_moyenne?: number;
  nombre_avis?: number;
  
  // Dates
  date_creation?: string;
  date_modification?: string;
  
  // PDIPR
  pdipr_inscription?: boolean;
  pdipr_date_inscription?: string;
  
  // Profil altimétrique
  profil_altimetrique?: AltitudeProfile;
}

// Interface pour les points du profil altimétrique
export interface ProfilePoint {
  distance: number;
  altitude: number;
  coordinates: {
    lon: number;
    lat: number;
  };
}

// Interface pour le profil altimétrique
export interface AltitudeProfile {
  elevation_gain: number;
  elevation_loss: number;
  image: string;
  max_altitude: number;
  min_altitude: number;
  points: ProfilePoint[];
  total_distance: number;
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
  content: string | {
    response: string;
    synthese?: string;
    conclusion?: string;
    recommandations?: HikeResult[];
  };
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Media {
  titre?: string;
  legende?: string;
  type: string;
  url: string;
  auteur?: string;
  licence?: string;
}

export interface Accessibilite {
  pmr: boolean;
  poussette: boolean;
  niveau_difficulte_acces: string;
} 