'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/search';
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

export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSendMessage(suggestion);
    }
  };
  
  // Exemples de requêtes pour aider l'utilisateur
  const suggestions = [
    "Randonnée familiale près du Mont Aigoual",
    "Circuit avec des cascades et des rivières",
    "Parcours panoramique sur 3-4 heures"
  ];

  // Essayer de parser une chaîne JSON en objet avec meilleure récupération
  const tryParseJSON = (jsonString: string): any | null => {
    if (typeof jsonString !== 'string') return null;
    
    // Essai de parsing complet
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.log('Erreur de parsing JSON, tentative de réparation:', e);
      
      // Vérifier si c'est un JSON tronqué mais contenant des données structurées
      try {
        // Étape 1: Vérifier si la chaîne contient l'essentiel de la structure
        if (jsonString.includes('"message"') && jsonString.includes('"results"')) {
          // Étape 2: Extraire le message
          const messageRegex = /"message"\s*:\s*"([^"]*)"/;
          const messageMatch = jsonString.match(messageRegex);
          const message = messageMatch ? messageMatch[1] : "Message non disponible";
          
          // Étape 3: Extraire le titre, sous-titre et interprétation
          const titleRegex = /"title"\s*:\s*"([^"]*)"/;
          const subtitleRegex = /"subtitle"\s*:\s*"([^"]*)"/;
          const queryRegex = /"query_interpretation"\s*:\s*"([^"]*)"/;
          const countRegex = /"results_count"\s*:\s*(\d+)/;
          
          const titleMatch = jsonString.match(titleRegex);
          const subtitleMatch = jsonString.match(subtitleRegex);
          const queryMatch = jsonString.match(queryRegex);
          const countMatch = jsonString.match(countRegex);
          
          const title = titleMatch ? titleMatch[1] : "Résultats de recherche";
          const subtitle = subtitleMatch ? subtitleMatch[1] : "Détails non disponibles";
          const queryInterpretation = queryMatch ? queryMatch[1] : "Requête non interprétée";
          const resultsCount = countMatch ? parseInt(countMatch[1]) : 0;
          
          // Étape 4: Extraire les items - utilisation d'une approche plus robuste
          const items: ResultItem[] = [];
          
          // Trouver l'emplacement du tableau items dans la chaîne
          const itemsStartIndex = jsonString.indexOf('"items"');
          if (itemsStartIndex > 0) {
            let bracketCount = 0;
            let itemStartIndex = -1;
            
            // Parcourir la chaîne pour trouver les objets individuels
            for (let i = itemsStartIndex; i < jsonString.length; i++) {
              if (jsonString[i] === '{') {
                if (bracketCount === 0) {
                  // Début d'un nouvel objet item
                  itemStartIndex = i;
                }
                bracketCount++;
              } else if (jsonString[i] === '}') {
                bracketCount--;
                if (bracketCount === 0 && itemStartIndex >= 0) {
                  // Fin de l'objet - essayer de le parser
                  try {
                    const itemJson = jsonString.substring(itemStartIndex, i + 1);
                    const item = JSON.parse(itemJson);
                    
                    // Vérifier si l'objet a les propriétés minimales requises
                    if (item.id && item.title) {
                      items.push({
                        id: item.id,
                        title: item.title,
                        highlight_text: item.highlight_text || "Description non disponible",
                        match_reason: item.match_reason || "Raison non spécifiée",
                        key_features: Array.isArray(item.key_features) ? item.key_features : ["Information non disponible"],
                        tags: Array.isArray(item.tags) ? item.tags : ["tag"]
                      });
                    }
                  } catch (itemError) {
                    console.log('Erreur lors du parsing d\'un item:', itemError);
                  }
                  
                  itemStartIndex = -1;
                }
              }
            }
          }
          
          // Étape 5: Extraire les suggestions si présentes
          let suggestions = null;
          
          if (jsonString.includes('"suggestions"')) {
            const refinementsRegex = /"refinements"\s*:\s*\[([\s\S]*?)\]/;
            const questionsRegex = /"questions"\s*:\s*\[([\s\S]*?)\]/;
            
            const refinementsMatch = jsonString.match(refinementsRegex);
            const questionsMatch = jsonString.match(questionsRegex);
            
            let refinements: string[] = [];
            let questions: string[] = [];
            
            // Traiter les refinements s'ils existent
            if (refinementsMatch && refinementsMatch[1]) {
              // Extraire chaque chaîne entre guillemets
              const refinementStrings = refinementsMatch[1].match(/"([^"]*)"/g);
              if (refinementStrings) {
                refinements = refinementStrings.map(str => str.replace(/"/g, ''));
              }
            }
            
            // Traiter les questions s'ils existent
            if (questionsMatch && questionsMatch[1]) {
              // Extraire chaque chaîne entre guillemets
              const questionStrings = questionsMatch[1].match(/"([^"]*)"/g);
              if (questionStrings) {
                questions = questionStrings.map(str => str.replace(/"/g, ''));
              }
            }
            
            if (refinements.length > 0 || questions.length > 0) {
              suggestions = {
                refinements: refinements.length > 0 ? refinements : undefined,
                questions: questions.length > 0 ? questions : undefined
              };
            }
          }
          
          // Étape 6: Construire l'objet réparé
          return {
            message: message,
            results: {
              title: title,
              subtitle: subtitle,
              query_interpretation: queryInterpretation,
              results_count: resultsCount,
              items: items,
              suggestions: suggestions
            }
          };
        }
      } catch (repairError) {
        console.error('Erreur lors de la réparation du JSON:', repairError);
      }
      
      return null;
    }
  };

 
 
  // Fonction pour vérifier si le contenu est un message complexe avec résultats
  const isComplexMessage = (content: any): content is MessageContent => {
    // Vérifier que c'est un objet et qu'il a une propriété results valide
    return (
      typeof content === 'object' &&
      content !== null &&
      typeof content.results === 'object' &&
      content.results !== null &&
      typeof content.message === 'string'
    );
  };

  // Fonction pour vérifier si le contenu est une réponse structurée avec des données de randonnée
  const isRandoResponse = (content: any): content is MessageStructure => {
    // Si c'est juste un objet avec messages et response, c'est un message simple
    if (typeof content === 'object' && 
        content !== null && 
        Array.isArray(content.messages) && 
        typeof content.response === 'string' &&
        Object.keys(content).length <= 2) {
      return false;
    }
    
    // Vérifier si c'est un objet non-null
    const isObject = typeof content === 'object' && content !== null;
    if (!isObject) {
      return false;
    }
    
    // Vérifier si randonnees ou recommandations est présent
    const hasRandonnees = Array.isArray(content.randonnees);
    const hasRecommandations = Array.isArray(content.recommandations);
    
    // Vérifier si un des champs textuels est présent
    const hasSynthese = typeof content.synthese === 'string';
    const hasResponse = typeof content.response === 'string';
    const hasConclusion = typeof content.conclusion === 'string';
    
    return isObject && (hasRandonnees || hasRecommandations) && (hasSynthese || hasResponse || hasConclusion);
  };

  // Fonction pour rendre les suggestions
  const renderSuggestions = (suggestions: any) => {
    if (!suggestions) return null;
    
    return (
      <div className="space-y-3 mt-4">
        {suggestions.refinements && suggestions.refinements.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Vous pourriez préciser votre recherche :</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.refinements.map((suggestion: string, index: number) => (
                <button
                  key={index}
                  className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded-full border border-gray-300 hover:border-green-500 hover:text-green-700 transition-colors duration-200 flex items-center gap-1.5 shadow-sm hover:shadow liquid-badge"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {suggestions.questions && suggestions.questions.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Questions fréquentes :</div>
            <div className="space-y-2">
              {suggestions.questions.map((question: string, index: number) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 bg-white text-left text-gray-700 text-sm rounded-lg border border-gray-300 hover:border-green-500 hover:text-green-700 transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow group result-card"
                  onClick={() => handleSuggestionClick(question)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {question}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Ajouter cette fonction pour formater le texte simple avec des styles améliorés
  const formatTextWithStyles = (text: string) => {
    if (!text) return null;

    // Diviser le texte en lignes pour traiter chaque ligne séparément
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Détecter les titres en gras avec format "**Titre :**" ou "**Titre**"
      const titleColonMatch = line.match(/^\s*\*\*([^*]+)\*\*\s*:/);
      const titleMatch = line.match(/^\s*\*\*([^*]+)\*\*/);
      
      if (titleColonMatch || titleMatch) {
        // Utiliser le match le plus précis
        const matchToUse = titleColonMatch || titleMatch;
        
        // Mesure de sécurité supplémentaire (bien que la condition ci-dessus garantisse déjà que matchToUse n'est pas null)
        if (!matchToUse) return <div key={`line-${lineIndex}`}>{line}</div>;
        
        const titleText = matchToUse[1].trim();
        
        // Pour les titres avec ":", extraire le reste de la ligne après les ":"
        let restOfLine = '';
        if (titleColonMatch) {
          restOfLine = line.replace(/^\s*\*\*([^*]+)\*\*\s*:/, '');
        }
        
        // Personnaliser l'affichage en fonction du type de titre
        let titleStyle = "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-800";
        let titleIcon = null;
        
        if (titleText.toLowerCase().includes("points forts")) {
          titleStyle = "bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-800";
          titleIcon = (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
        } else if (titleText.toLowerCase().includes("précautions")) {
          titleStyle = "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-800";
          titleIcon = (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
        } else if (titleText.toLowerCase().includes("chaussures") || 
                  titleText.toLowerCase().includes("eau") || 
                  titleText.toLowerCase().includes("météo") ||
                  titleText.toLowerCase().includes("hydratation") ||
                  titleText.toLowerCase().includes("téléphone") ||
                  titleText.toLowerCase().includes("respect")) {
          titleStyle = "bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 text-indigo-800";
          titleIcon = (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        } else if (titleText.toLowerCase().includes("facilité") || 
                  titleText.toLowerCase().includes("fraîcheur") || 
                  titleText.toLowerCase().includes("nature") ||
                  titleText.toLowerCase().includes("courte")) {
          titleStyle = "bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 text-teal-800";
          titleIcon = (
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        }
        
        // Appliquer un style spécial pour ces titres
        return (
          <div key={`line-${lineIndex}`} className="mb-3">
            <span className={`inline-flex items-center px-3 py-1 ${titleStyle} rounded-lg font-medium shadow-sm mb-1`}>
              {titleIcon}
              {titleText}
            </span>
            {restOfLine && <span className="ml-2">{restOfLine}</span>}
          </div>
        );
      }
      
      // Détecter et remplacer les éléments en gras dans une ligne
      // comme "**Facilité :**" qui seraient en milieu de ligne et pas au début
      const inlineStrongPattern = /\*\*([^*]+)\*\*/g;
      if (inlineStrongPattern.test(line)) {
        const parts = [];
        let lastIndex = 0;
        let match;
        const regex = new RegExp(inlineStrongPattern);
        
        while ((match = regex.exec(line)) !== null) {
          // Ajouter le texte avant le match
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
          }
          
          // Ajouter le texte en gras
          parts.push(
            <span key={`strong-${match.index}`} className="font-semibold text-gray-900">
              {match[1]}
            </span>
          );
          
          lastIndex = match.index + match[0].length;
        }
        
        // Ajouter le reste de la ligne après le dernier match
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }
        
      return (
          <div key={`line-${lineIndex}`} className={lineIndex > 0 ? "mt-2" : ""}>
            {parts}
          </div>
        );
      }
      
      // Détecter les puces avec format "• "
      if (line.match(/^\s*•\s+/)) {
        const bulletContent = line.replace(/^\s*•\s+/, '');
        // Traiter le contenu après la puce pour les éventuels formatages supplémentaires (gras, etc.)
        return (
          <div key={`line-${lineIndex}`} className="flex items-start mb-2 ml-2">
            <span className="text-green-500 inline-block mr-2 text-lg">•</span>
            <span>{bulletContent.replace(/\*\*([^*]+)\*\*/g, '$1')}</span>
        </div>
      );
    }
    
      // Détecter les tirets avec format "- "
      if (line.match(/^\s*-\s+/)) {
        const bulletContent = line.replace(/^\s*-\s+/, '');
        // Traiter le contenu après le tiret pour les éventuels formatages supplémentaires
      return (
          <div key={`line-${lineIndex}`} className="flex items-start mb-2 ml-2">
            <span className="text-green-500 inline-block mr-2">-</span>
            <span>{bulletContent.replace(/\*\*([^*]+)\*\*/g, '$1')}</span>
            </div>
        );
      }
      
      // Remplacer les émoticônes textuelles par des émoticônes graphiques
      if (line.includes('😊') || line.includes('🙂')) {
        return (
          <div key={`line-${lineIndex}`} className={lineIndex > 0 ? "mt-2" : ""}>
            {line.split(/(😊|🙂)/).map((part, i) => 
              part === '😊' || part === '🙂' ? 
                <span key={i} className="inline-block text-xl transform animate-pulse">
                  {part}
                </span> : part.replace(/\*\*([^*]+)\*\*/g, '$1')
            )}
        </div>
      );
    }
    
      // Format normal pour les autres lignes (enlever les astérisques)
      return (
        <div key={`line-${lineIndex}`} className={lineIndex > 0 ? "mt-2" : ""}>
          {line.replace(/\*\*([^*]+)\*\*/g, '$1')}
        </div>
      );
    });
  };

  // Ajouter la fonction de rendu des critères de recherche
  const renderSearchCriteria = (criteres?: CriteresRecherche) => {
    if (!criteres) return null;

    const hasCriteria = 
      criteres.semantic_text || 
      criteres.location || 
      criteres.filters?.difficulte || 
      criteres.filters?.pratique || 
      (criteres.filters?.longueur && (criteres.filters.longueur.min || criteres.filters.longueur.max)) || 
      (criteres.filters?.themes && criteres.filters.themes.length > 0);

    if (!hasCriteria) return null;

    return (
      <div className="mt-3 p-4 bg-green-50 rounded-xl border border-green-200 shadow-inner text-sm text-gray-700 ">
        <h4 className="font-medium text-green-800 flex items-center mb-2">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Critères de recherche
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {criteres.semantic_text && (
            <div className="col-span-2">
              <span className="font-medium">Recherche :</span> {criteres.semantic_text}
            </div>
          )}
          {criteres.location && (
            <div>
              <span className="font-medium">Lieu :</span> {criteres.location}
          </div>
          )}
          {criteres.filters?.difficulte && (
            <div>
              <span className="font-medium">Difficulté :</span> {criteres.filters.difficulte}
            </div>
          )}
          {criteres.filters?.pratique && (
            <div>
              <span className="font-medium">Pratique :</span> {criteres.filters.pratique}
            </div>
          )}
          {criteres.filters?.longueur && (criteres.filters.longueur.min || criteres.filters.longueur.max) && (
            <div>
              <span className="font-medium">Distance :</span> 
              {criteres.filters.longueur.min ? `${criteres.filters.longueur.min / 1000} km min` : ''}
              {criteres.filters.longueur.min && criteres.filters.longueur.max ? ' - ' : ''}
              {criteres.filters.longueur.max ? `${criteres.filters.longueur.max / 1000} km max` : ''}
            </div>
          )}
          {criteres.filters?.themes && criteres.filters.themes.length > 0 && (
            <div className="col-span-2 mt-1">
              <span className="font-medium">Thèmes :</span> 
              <div className="mt-1 flex flex-wrap gap-1">
                {criteres.filters.themes.map(theme => (
                  <span key={theme} className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs border border-green-200">
                    {theme}
                  </span>
            ))}
          </div>
            </div>
          )}
        </div>
        </div>
      );
  };

  // Ajouter la fonction de rendu des points forts
  const renderPointsForts = (points: string[]) => {
    if (!points || points.length === 0) return null;
    
      return (
      <div className="mt-3">
        <h4 className="font-medium text-green-800 flex items-center mb-2">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Points forts
        </h4>
        <ul className="space-y-1 pl-2">
          {points.map((point, index) => {
            const [title, description] = point.includes(':') 
              ? [point.split(':')[0].trim(), point.split(':').slice(1).join(':').trim()]
              : [null, point];
            
              return (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">•</span>
                <div>
                  {title && <span className="font-medium">{title}:</span>} {description || title}
                </div>
              </li>
            );
          })}
        </ul>
                </div>
              );
  };

  // Ajouter la fonction d'affichage du type d'itinéraire avec icône
  const getItineraireTypeIcon = (type: string) => {
    const typeNormalized = type.toLowerCase();
    
    if (typeNormalized.includes('boucle')) {
                return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Boucle</span>
                  </div>
                );
              }
              
    if (typeNormalized.includes('aller-retour') || typeNormalized.includes('aller retour')) {
              return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span>Aller-retour</span>
                </div>
              );
            }
            
    if (typeNormalized.includes('aller simple')) {
              return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span>Aller simple</span>
                </div>
              );
            }
            
    if (typeNormalized.includes('itinérance')) {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span>Itinérance</span>
        </div>
      );
    }
    
          return (
      <div className="flex items-center gap-1">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span>{type}</span>
            </div>
          );
  };

  // Mettre à jour la fonction de rendu d'une randonnée
  const renderRandonnee = (rando: RandonneeItem, index: number, isRecommandation: boolean) => {
    const cardClasses = `
      p-4 rounded-xl border shadow-sm stagger-in
      ${isRecommandation 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-blue-100' 
        : 'bg-white border-gray-200'
      } 
      ${isRecommandation ? 'zoom-on-hover' : 'hover:shadow-md result-card'}
    `;

    // Utiliser presentation_courte s'il existe, sinon tronquer presentation
    const description = rando.presentation_courte || 
      (rando.presentation && rando.presentation.length > 150 
        ? rando.presentation.substring(0, 150) + '...' 
        : rando.presentation);
        
        return (
      <div key={rando.id_local} className={cardClasses} style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
        <div className="flex items-start">
          <div className={`
            rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1 border shadow-sm
            ${isRecommandation 
              ? 'bg-blue-100 text-blue-700 border-blue-200 pulse-on-hover' 
              : 'bg-green-50 text-green-700 border-green-200'
            }
          `}>
            {isRecommandation ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
          
          <div className="ml-3 flex-1">
            <h4 className="font-medium text-gray-900">{rando.nom_itineraire}</h4>
            
            {/* Départ et arrivée */}
            {(rando.depart || rando.arrivee) && (
              <p className="text-xs text-gray-600 mt-1">
                {rando.depart && <span><span className="font-medium">Départ:</span> {rando.depart}</span>}
                {rando.depart && rando.arrivee && <span> | </span>}
                {rando.arrivee && rando.arrivee !== rando.depart && <span><span className="font-medium">Arrivée:</span> {rando.arrivee}</span>}
              </p>
            )}
            
            <p className="mt-2 text-gray-700 text-sm">{description}</p>
            
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs bg-opacity-50 p-2 rounded-lg">
              <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded border border-gray-100 shadow-sm">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium">{rando.denivele_positif}m</span>
          </div>
              <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded border border-gray-100 shadow-sm">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{rando.duree}h</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded border border-gray-100 shadow-sm">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="font-medium">
                  {rando.longueur_km 
                    ? Number(rando.longueur_km).toFixed(1) 
                    : (rando.longueur 
                        ? (Number(rando.longueur) / 1000).toFixed(1) 
                        : '0')} km
                </span>
              </div>
            </div>
            
            {/* Informations techniques supplémentaires */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
              {rando.type_itineraire && (
                <div className="flex items-center gap-1">
                  {getItineraireTypeIcon(rando.type_itineraire)}
                </div>
              )}
              
              {(rando.altitude_min !== undefined && rando.altitude_max !== undefined) && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span>Alt. {rando.altitude_min}m - {rando.altitude_max}m</span>
        </div>
              )}
              
              {rando.pratique && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>{rando.pratique}</span>
          </div>
              )}
              
              {rando.communes_nom && rando.communes_nom.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{rando.communes_nom.length > 2 
                    ? `${rando.communes_nom[0]}, ${rando.communes_nom[1]}...` 
                    : rando.communes_nom.join(', ')}</span>
                </div>
              )}
                </div>
            
            {/* Afficher les points forts s'ils existent */}
            {rando.points_forts && rando.points_forts.length > 0 && renderPointsForts(rando.points_forts)}
            
            {/* Afficher un extrait des points d'intérêt s'ils existent */}
            {rando.points_interet && (
              <div className="mt-3">
                <h4 className="font-medium text-blue-800 flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Points d'intérêt
                </h4>
                <p className="text-xs text-gray-600 italic pl-2">
                  {rando.points_interet.length > 120 
                    ? rando.points_interet.substring(0, 120) + '...' 
                    : rando.points_interet}
                </p>
              </div>
            )}
            
            {/* Afficher les infos sur l'accessibilité s'il y en a */}
            {rando.accessibilite && rando.accessibilite.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs text-gray-700 font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Accessibilité
                </h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {rando.accessibilite.map((access, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      {access}
                    </span>
              ))}
            </div>
              </div>
            )}
            
            {/* Infos sur le transport */}
            {(rando.parking_info || rando.transports_commun) && (
              <div className="mt-3 text-xs text-gray-600">
                {rando.parking_info && (
                  <div className="flex items-start mt-1">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span><span className="font-medium">Parking:</span> {rando.parking_info}</span>
                  </div>
                )}
                
                {rando.transports_commun && (
                  <div className="flex items-start mt-1">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span><span className="font-medium">Transports:</span> {rando.transports_commun}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Afficher les thèmes s'ils existent */}
            {rando.themes && rando.themes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rando.themes.map(theme => (
                  <span key={theme} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs liquid-badge">
                    {theme}
                  </span>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Fonction pour obtenir la couleur du texte en fonction de la difficulté
  const getDifficultyTextColor = (difficulty: string) => {
    const difficultyLower = difficulty.toLowerCase();
    if (difficultyLower.includes('facile') || difficultyLower.includes('très facile')) {
      return 'text-green-600';
    }
    if (difficultyLower.includes('moyen')) {
      return 'text-amber-600';
    }
    if (difficultyLower.includes('difficile')) {
      return 'text-orange-600';
    }
    if (difficultyLower.includes('très difficile')) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  // Mise à jour de la fonction renderMessageContent pour inclure le nouveau format
  const renderMessageContent = (content: any) => {
    // Si le contenu est une chaîne simple
    if (typeof content === 'string') {
      return formatTextWithStyles(content);
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
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-2">
                Recommandations spéciales
              </h3>
              <div className="space-y-3">
                {content.recommandations.map((rando: RandonneeItem, index: number) => (
                  renderRandonnee(rando, index, true)
                ))}
              </div>
            </div>
          )}

          {/* Afficher les randonnées trouvées */}
          {content.randonnees && content.randonnees.length > 0 && (
            <div className="space-y-3">
              {content.randonnees.map((rando: RandonneeItem, index: number) => (
                renderRandonnee(rando, index, false)
              ))}
            </div>
          )}

          {/* Afficher la conclusion si présente */}
          {content.conclusion && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Conclusion</h3>
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Zone de messages avec meilleur styling */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50">
        {messages.map((msg, index) => {
          // Déterminer la classe selon le rôle
          let messageClass = msg.role === 'user' 
            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-none shadow-[0_3px_6px_rgba(0,0,0,0.2),_0_1px_0_rgba(255,255,255,0.2)_inset]' 
            : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-[0_3px_6px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,1)_inset,_0_-1px_0_rgba(0,0,0,0.05)_inset]';
          
          return (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] p-3 rounded-lg ${messageClass}`}>
                {renderMessageContent(msg.content)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        
        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-lg shadow-[0_3px_6px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,1)_inset] border border-gray-200 p-3 max-w-[85%]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Suggestions pour démarrer la conversation */}
      {messages.length <= 1 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2 font-medium">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs bg-white text-gray-700 rounded-full 
                         shadow-[0_2px_4px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,1)_inset] 
                         border border-gray-200
                         hover:bg-green-50 hover:text-green-700 hover:border-green-200 
                         transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Formulaire d'entrée */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl 
                     hover:from-green-600 hover:to-green-700 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
          </button>
        </div>
      </form>
    </div>
  );
} 