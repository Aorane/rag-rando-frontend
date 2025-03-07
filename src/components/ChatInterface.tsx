'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, HikeResult } from '@/types/search';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';

// Import dynamique de react-markdown pour éviter les erreurs de compilation
const ReactMarkdownDynamic = dynamic(() => import('react-markdown'), { ssr: false });

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Ancienne structure
interface StructuredResponse {
  conversation: {
    message: string;
  };
  summary: {
    title: string;
    subtitle: string;
    query_interpretation: string;
    results_count: number;
  };
  results: {
    id: string;
    title: string;
    highlight_text: string;
    match_reason: string;
    key_features: string[];
    tags: string[];
  }[];
  suggestions?: {
    refinements?: string[];
    questions?: string[];
  };
  conclusion?: string;
}

// Structure la plus récente
interface ResultItem {
  id: string;
  title: string;
  highlight_text: string;
  match_reason: string;
  key_features: string[];
  tags: string[];
}

interface CurrentStructuredResponse {
  message: string;
  results: {
    title: string;
    subtitle: string;
    query_interpretation?: string;
    results_count: number;
    items: ResultItem[];
    suggestions?: {
      refinements?: string[];
      questions?: string[];
    };
  };
  conclusion?: string;
}

// Mise à jour des interfaces pour correspondre au format du backend
interface BackendSearchResult {
  id_local: string;
  nom_itineraire: string;
  difficulte: string;
  longueur: number;
  presentation: string;
  presentation_courte: string;
  pratique: string;
  denivele_positif: number;
  duree: number;
  coordonnees_depart?: {
    lat: number;
    lon: number;
  };
  coordonnees_arrivee?: {
    lat: number;
    lon: number;
  };
  geometry?: any;
  medias?: Array<{
    type: string;
    url: string;
    description: string;
    titre: string;
  }>;
  // Autres propriétés possibles...
}

interface MessageContent {
  message: string;
  results: {
    title: string;
    subtitle: string;
    items: Array<{
      id: string;
      title: string;
      highlight_text: string;
      match_reason: string;
      key_features?: string[];
      tags?: string[];
    }>;
    suggestions?: {
      refinements?: string[];
      questions?: string[];
    };
  };
  conclusion?: string;
}

// Mettre à jour l'interface RandonneeItem pour correspondre à la structure exacte du backend
interface RandonneeItem {
  id_local: string;
  nom_itineraire: string;
  nom?: string;                    // nom alternatif
  longueur?: number;               // en mètres
  longueur_km?: number;            // en kilomètres
  duree: number;                  // en heures
  difficulte: string;             // facile/moyenne/difficile
  denivele_positif: number;       // en mètres
  denivele_negatif?: number;      // en mètres
  altitude_max?: number;           // en mètres 
  altitude_min?: number;           // en mètres
  pratique?: string;               // pédestre, VTT, etc.
  type_itineraire?: string;        // boucle, aller-retour, etc.
  presentation?: string;           // description détaillée
  presentation_courte?: string;    // description courte
  themes?: string[];               // thèmes associés
  points_forts?: string[];         // points forts
  points_interet?: string;        // description des points d'intérêt
  communes_nom?: string[];        // communes traversées
  depart?: string;                // point de départ
  arrivee?: string;               // point d'arrivée
  parking_info?: string;          // infos sur le parking
  transports_commun?: string;     // infos sur les transports
  accessibilite?: string[];       // infos d'accessibilité
  geometry?: any;                 // données géométriques pour la carte
}

interface CriteresRecherche {
  semantic_text: string;
  location: string | null;
  distance_max_from_location: number | null;
  filters: {
    pratique: string | null;
    difficulte: string | null;
    longueur: {
      min?: number;
      max?: number;
    } | null;
    themes: string[] | null;
  }
}

interface MessageStructure {
  response: string;
  messages: {
    role: string;
    content: string;
  }[];
  analysis?: {
    should_search: boolean;
    search_params: any;
    results_count: number;
  };
  synthese?: string;
  conclusion?: string;
  randonnees?: RandonneeItem[];
  recommandations?: RandonneeItem[];
  nombre_resultats?: number;
  criteres_recherche?: CriteresRecherche;
}

// Suggestions prédéfinies pour aider l'utilisateur
const DEFAULT_SUGGESTIONS = [
  "Randonnée facile près de Florac",
  "Circuit avec des cascades et des rivières",
  "Randonnée familiale de moins de 3h",
  "Parcours panoramique dans les Cévennes"
];

export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Ajuster automatiquement la hauteur du textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSendMessage(suggestion);
    }
  };
  
  // Extraire des suggestions dynamiques du dernier message de l'assistant
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && typeof lastMessage.content === 'object') {
        // Extraire des suggestions basées sur les thèmes des randonnées
        const dynamicSuggestions: string[] = [];
        
        // Ajouter des suggestions basées sur les thèmes des randonnées trouvées
        const randonnees = lastMessage.content.randonnees || [];
        const themes = new Set<string>();
        
        randonnees.forEach(rando => {
          if (rando.themes) {
            rando.themes.forEach(theme => themes.add(theme));
          }
        });
        
        // Créer des suggestions basées sur les thèmes
        themes.forEach(theme => {
          dynamicSuggestions.push(`Randonnée avec thème ${theme}`);
        });
        
        // Ajouter des suggestions basées sur la difficulté
        if (randonnees.some(r => r.difficulte === 'facile')) {
          dynamicSuggestions.push("Plus de randonnées faciles");
        }
        if (randonnees.some(r => r.difficulte === 'moyen' || r.difficulte === 'moyenne')) {
          dynamicSuggestions.push("Randonnées de difficulté moyenne");
        }
        
        // Limiter à 4 suggestions dynamiques maximum
        const limitedSuggestions = dynamicSuggestions.slice(0, 4);
        
        // Si nous avons des suggestions dynamiques, les utiliser, sinon revenir aux suggestions par défaut
        if (limitedSuggestions.length > 0) {
          setSuggestions(limitedSuggestions);
        } else {
          setSuggestions(DEFAULT_SUGGESTIONS);
        }
      }
    }
  }, [messages]);

  // Formater le texte avec des styles (gras, italique, listes)
  const formatTextWithStyles = (text: string) => {
    if (!text) return null;

    // Remplacer les sauts de ligne par des balises <br>
    let formattedText = text.replace(/\n/g, '<br>');

    // Formater le texte en gras (**texte** ou __texte__)
    formattedText = formattedText.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

    // Formater le texte en italique (*texte* ou _texte_)
    formattedText = formattedText.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

    // Formater les listes à puces
    formattedText = formattedText.replace(/^[*\-•] (.+)$/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/<li>(.+)<\/li>/g, '<ul class="list-disc ml-5 my-2"><li>$1</li></ul>');
    formattedText = formattedText.replace(/<\/ul>\s*<ul class="list-disc ml-5 my-2">/g, '');

    // Formater les listes numérotées
    formattedText = formattedText.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/(<li>.+<\/li>)(?!\s*<\/ul>)/g, '<ol class="list-decimal ml-5 my-2">$1</ol>');
    formattedText = formattedText.replace(/<\/ol>\s*<ol class="list-decimal ml-5 my-2">/g, '');

    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  // Obtenir la couleur du texte en fonction de la difficulté
  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'facile':
        return 'text-green-600';
      case 'moyen':
      case 'moyenne':
        return 'text-amber-600';
      case 'difficile':
        return 'text-red-600';
      case 'très difficile':
        return 'text-purple-700';
      default:
        return 'text-gray-700';
    }
  };

  // Obtenir l'icône du type d'itinéraire
  const getItineraireTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'boucle':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="1.5" />
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 22C14.5 22 16.5 17.5228 16.5 12C16.5 6.47715 14.5 2 12 2" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case 'aller-retour':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 16L3 12M3 12L7 8M3 12H21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 8L21 12M21 12L17 16M21 12H3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'aller simple':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'itinérance':
    return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 17L9 11L13 15L21 7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 7H21V11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
    return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18L15 12L9 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  // Afficher une randonnée
  const renderRandonnee = (rando: HikeResult, index: number, isRecommandation: boolean) => {
    // Si c'est une recommandation, on utilise un design beaucoup plus riche
    if (isRecommandation) {
      // Récupérer l'URL de la première image si disponible
      const images = rando.medias?.filter(media => 
        media.type === 'image' || 
        (media.url && 
         (media.url.endsWith('.jpg') || 
          media.url.endsWith('.jpeg') || 
          media.url.endsWith('.png') || 
          media.url.endsWith('.webp'))
        )
      ) || [];

      return (
        <div 
          key={`${rando.id_local}-${index}`}
          className="overflow-hidden rounded-xl border border-indigo-200 shadow-lg transition-all duration-300 hover:shadow-xl mb-5 bg-white"
        >
          {/* En-tête avec badge de recommandation */}
          <div className="relative">
            <div className="absolute top-4 left-4 z-20">
              <div className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-md">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77385 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97933 9.71885C4.19562 9.14945 4.59839 7.90983 5.56712 7.90983H9.02832C9.46154 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z" strokeWidth="1.5" />
                </svg>
                <span className="font-medium text-sm">Recommandé</span>
              </div>
            </div>
            
            {/* Bannière d'image principale */}
            <div className="w-full h-48 relative overflow-hidden">
              {images.length > 0 ? (
                <img 
                  src={images[0].url} 
                  alt={images[0].titre || rando.nom_itineraire} 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 21.4L14 11.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16.4L9 11.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              
              {/* Overlay pour le dégradé */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Type d'itinéraire et difficulté sur l'image */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full text-gray-800 text-xs shadow-sm">
                  {getItineraireTypeIcon(rando.type_itineraire || '')}
                  <span>{rando.type_itineraire || 'Itinéraire'}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                  rando.difficulte.toLowerCase() === 'facile' ? 'bg-green-100 text-green-800' :
                  rando.difficulte.toLowerCase() === 'moyen' || rando.difficulte.toLowerCase() === 'moyenne' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {rando.difficulte}
                </div>
              </div>
              
              {/* Galerie photo */}
              {images.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
                  {images.length} photos
                </div>
              )}
            </div>
          </div>
          
          {/* Corps de la carte */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900">{rando.nom_itineraire}</h3>
            
            {/* Description */}
            {rando.presentation_courte && (
              <p className="mt-2 text-gray-700">
                {rando.presentation_courte}
              </p>
            )}
            
            {/* Caractéristiques techniques en grille */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-indigo-50 p-3 rounded-lg flex flex-col items-center border border-indigo-100">
                <span className="text-xs text-indigo-600 font-medium">Distance</span>
                <span className="text-lg font-bold text-indigo-900">
                  {rando.longueur ? (rando.longueur / 1000).toFixed(1) : rando.longueur_km?.toFixed(1)} km
                </span>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg flex flex-col items-center border border-indigo-100">
                <span className="text-xs text-indigo-600 font-medium">Durée</span>
                <span className="text-lg font-bold text-indigo-900">
                  {rando.duree.toFixed(1)} h
                </span>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg flex flex-col items-center border border-indigo-100">
                <span className="text-xs text-indigo-600 font-medium">Dénivelé</span>
                <span className="text-lg font-bold text-indigo-900">
                  {rando.denivele_positif} m
                </span>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-lg flex flex-col items-center border border-indigo-100">
                <span className="text-xs text-indigo-600 font-medium">Altitude</span>
                <span className="text-lg font-bold text-indigo-900">
                  {rando.altitude_min && rando.altitude_max ? 
                    `${rando.altitude_min}-${rando.altitude_max} m` : 
                    rando.altitude_max ? `${rando.altitude_max} m` : '-'}
                </span>
              </div>
            </div>
            
            {/* Points forts */}
            {rando.points_forts && rando.points_forts.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Points forts
                </h4>
                <ul className="space-y-1 pl-4">
                  {rando.points_forts.map((point, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Thèmes et accessibilité */}
            <div className="mt-4 flex flex-wrap gap-2">
              {rando.themes && rando.themes.map((theme, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                  {theme}
                </span>
              ))}
              
              {rando.accessibilite && rando.accessibilite.map((access, i) => (
                <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                  <svg className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {access}
                </span>
              ))}
            </div>
            
            {/* Informations sur le lieu */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Localisation
              </h4>
              
              <div className="space-y-1 text-sm">
                {rando.depart && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Départ:</span> {rando.depart}
                  </div>
                )}
                
                {rando.arrivee && rando.arrivee !== rando.depart && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Arrivée:</span> {rando.arrivee}
                  </div>
                )}
                
                {rando.communes_nom && rando.communes_nom.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">Communes:</span> {rando.communes_nom.join(', ')}
                  </div>
                )}
              </div>
            </div>
            
            {/* Informations pratiques */}
            {(rando.parking_info || rando.transports_commun) && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Informations pratiques
                </h4>
                
                {rando.parking_info && (
                  <div className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                      <path d="M9 8H15M12 8V16" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{rando.parking_info}</span>
                  </div>
                )}
                
                {rando.transports_commun && (
                  <div className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8 18H16M5 9H19M5 15H19M6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4Z" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{rando.transports_commun}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Miniature de la galerie d'images */}
            {images.length > 1 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Photos
                </h4>
                
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {images.slice(1, 5).map((image, i) => (
                    <div key={i} className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                      <img 
                        src={image.url} 
                        alt={image.titre || `Photo ${i+1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {images.length > 5 && (
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium border border-gray-200">
                      +{images.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Design standard pour les randonnées normales (non recommandées)
    return (
      <div 
        key={`${rando.id_local}-${index}`}
        className={`p-4 rounded-lg border mb-3 transition-all duration-300 hover:shadow-md ${
          isRecommandation 
            ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isRecommandation ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
          }`}>
            {index + 1}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              {rando.nom_itineraire}
              {rando.type_itineraire && (
                <span className="inline-flex items-center text-gray-500 text-xs" title={rando.type_itineraire}>
                  {getItineraireTypeIcon(rando.type_itineraire)}
                </span>
              )}
            </h3>
            
            {/* Description courte */}
            {rando.presentation_courte && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {rando.presentation_courte}
              </p>
            )}
            
            {/* Caractéristiques techniques */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-500">Distance</span>
                <span className="font-medium">{rando.longueur ? (rando.longueur / 1000).toFixed(1) : rando.longueur_km?.toFixed(1)} km</span>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-500">Durée</span>
                <span className="font-medium">{rando.duree.toFixed(1)} h</span>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-500">Dénivelé</span>
                <span className="font-medium">{rando.denivele_positif} m</span>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-500">Difficulté</span>
                <span className={`font-medium ${getDifficultyTextColor(rando.difficulte)}`}>
                  {rando.difficulte}
                </span>
              </div>
            </div>
            
            {/* Points forts */}
            {rando.points_forts && rando.points_forts.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Points forts</h4>
                <ul className="text-xs text-gray-600 space-y-1 pl-5 list-disc">
                  {rando.points_forts.slice(0, 3).map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Thèmes et accessibilité */}
            <div className="flex flex-wrap gap-1 mt-3">
              {rando.themes && rando.themes.map((theme, i) => (
                <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  {theme}
                </span>
              ))}
              
              {rando.accessibilite && rando.accessibilite.map((access, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {access}
                </span>
              ))}
            </div>
            
            {/* Informations pratiques */}
            {(rando.parking_info || rando.transports_commun) && (
              <div className="mt-3 text-xs text-gray-600">
                {rando.parking_info && (
                  <div className="flex items-start gap-1 mb-1">
                    <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                      <path d="M9 8H15M12 8V16" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{rando.parking_info}</span>
                  </div>
                )}
                
                {rando.transports_commun && (
                  <div className="flex items-start gap-1">
                    <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M8 18H16M5 9H19M5 15H19M6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4Z" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{rando.transports_commun}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Afficher le contenu du message
  const renderMessageContent = (content: any) => {
    // Si le contenu est une chaîne simple
    if (typeof content === 'string') {
              return (
        <div className="prose prose-sm max-w-none">
          {formatTextWithStyles(content)}
        </div>
      );
    }
    
    // Si le contenu est un objet avec des données de randonnée
    if (typeof content === 'object' && content !== null) {
          return (
            <div className="space-y-4">
          {/* Afficher la réponse textuelle */}
          {content.response && (
            <div className="prose prose-sm max-w-none">
              {formatTextWithStyles(content.response)}
            </div>
          )}

          {/* Bannière verte pour les résultats de recherche */}
          {content.nombre_resultats > 0 && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 20L3 17V7L9 4L15 7L21 4V14L15 17L9 14V4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 4V14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 7V17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h3 className="font-medium text-green-800">Résultats de recherche</h3>
                <p className="text-xs text-green-700">
                  {content.nombre_resultats} randonnée{content.nombre_resultats > 1 ? 's' : ''} trouvée{content.nombre_resultats > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Bannière jaune pour aucun résultat */}
          {content.nombre_resultats === 0 && !content.randonnees?.length && !content.recommandations?.length && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800">Aucune randonnée ne correspond à votre recherche</h3>
                <p className="text-xs text-amber-700">
                  Essayez de modifier vos critères ou d'explorer d'autres zones
                </p>
              </div>
                  </div>
          )}

          {/* Afficher la synthèse si présente */}
          {content.synthese && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Synthèse</h3>
              <div className="text-sm text-blue-700">
                {formatTextWithStyles(content.synthese)}
              </div>
            </div>
          )}

          {/* Afficher les recommandations si présentes */}
          {content.recommandations && content.recommandations.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77385 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97933 9.71885C4.19562 9.14945 4.59839 7.90983 5.56712 7.90983H9.02832C9.46154 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z" strokeWidth="1.5" />
                </svg>
                Recommandations spéciales
              </h3>
              <div className="space-y-3">
                {content.recommandations.map((rando: HikeResult, index: number) => (
                  console.log("rando recommandations", rando),
                  renderRandonnee(rando, index, true)
            ))}
          </div>
        </div>
          )}

          {/* Afficher les randonnées trouvées */}
          {content.randonnees && content.randonnees.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Toutes les randonnées</h3>
              <div className="space-y-3">
                {content.randonnees.map((rando: HikeResult, index: number) => (
                  renderRandonnee(rando, index, false)
                ))}
                </div>
            </div>
          )}

          {/* Afficher la conclusion si présente */}
          {content.conclusion && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
              <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12L11 14L15 10M12 3L13.9101 4.87147L16.5 4.20577L17.2184 6.78155L19.7942 7.5L19.1285 10.0899L21 12L19.1285 13.9101L19.7942 16.5L17.2184 17.2184L16.5 19.7942L13.9101 19.1285L12 21L10.0899 19.1285L7.5 19.7942L6.78155 17.2184L4.20577 16.5L4.87147 13.9101L3 12L4.87147 10.0899L4.20577 7.5L6.78155 6.78155L7.5 4.20577L10.0899 4.87147L12 3Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Conclusion
              </h3>
              <div className="text-sm text-green-700">
                {formatTextWithStyles(content.conclusion)}
              </div>
            </div>
          )}
      </div>
    );
    }

    // Fallback pour tout autre type de contenu
    return <div className="text-gray-700">{String(content)}</div>;
  };

  // Rendu des suggestions cliquables
  const renderSuggestions = () => {
    // N'afficher les suggestions que si nous ne sommes pas en train de charger
    // et si nous avons moins de 10 messages (pour ne pas encombrer une conversation avancée)
    if (isLoading || messages.length > 10) return null;
    
    return (
      <div className="mt-4 mb-2">
        <p className="text-xs text-gray-500 mb-2">Suggestions :</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
                <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-full 
                       border border-gray-200 hover:border-green-500 hover:bg-green-50 
                       hover:text-green-700 transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {suggestion}
          </div>
                </button>
              ))}
            </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Zone des messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const messageClass = isUser 
            ? 'bg-blue-50 border-blue-100 ml-8' 
            : 'bg-white border-gray-200 mr-8';
          
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${messageClass} animate-fade-in`}
            >
              <div className="flex items-start gap-2">
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 12L8 8L12 12L16 8L20 12M4 16L8 12L12 16L16 12L20 16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                
                <div className="flex-1">
                {renderMessageContent(msg.content)}
                </div>
                
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="p-4 rounded-lg border border-gray-200 bg-white mr-8 animate-fade-in">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 12L8 8L12 12L16 8L20 12M4 16L8 12L12 16L16 12L20 16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Afficher les suggestions après les messages */}
        {!isLoading && renderSuggestions()}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Formulaire de saisie */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1 border border-gray-300 rounded-lg focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all bg-white">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question sur les randonnées dans les Cévennes..."
              className="w-full p-3 pr-10 outline-none resize-none max-h-32 text-gray-700 placeholder-gray-400 bg-transparent"
              rows={1}
              disabled={isLoading}
            />
            
            {inputValue.length > 0 && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-lg flex items-center justify-center transition-all ${
              !inputValue.trim() || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 12h12m0 0l-5-5m5 5l-5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
          </button>
        </form>
        </div>
    </div>
  );
} 