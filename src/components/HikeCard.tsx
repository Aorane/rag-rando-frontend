import { useState } from 'react';
import { HikeResult } from '@/types/search';
import { cleanText, formatDuration, getDifficultyColor } from '@/utils/text';

interface HikeCardProps {
  hike: HikeResult;
  isHighlighted: boolean;
  onHover: (id: string) => void;
  onSelect: (hike: HikeResult) => void;
}

export default function HikeCard({ hike, isHighlighted, onHover, onSelect }: HikeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Formater la durée (ex: 2h30)
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`;
  };

  // Formater la distance en km
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1) + ' km';
  };

  // Mapper les difficultés à des couleurs
  const difficultyColor = (difficulty: string) => {
    const map: Record<string, string> = {
      'Très facile': 'bg-green-100 text-green-800 border-green-200',
      'Facile': 'bg-blue-100 text-blue-800 border-blue-200',
      'Moyen': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Difficile': 'bg-orange-100 text-orange-800 border-orange-200',
      'Très difficile': 'bg-red-100 text-red-800 border-red-200'
    };
    return map[difficulty] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Obtenir les 4 premières lignes de la description
  const getShortDescription = (desc: string | undefined) => {
    if (!desc) return "Aucune description disponible.";
    const lines = desc.split('\n').filter(line => line.trim());
    return lines.slice(0, 4).join('\n');
  };

  // Vérifier si la description est tronquée
  const isDescriptionTruncated = (desc: string | undefined) => {
    if (!desc) return false;
    const lines = desc.split('\n').filter(line => line.trim());
    return lines.length > 4;
  };

  // Fonction pour obtenir l'icône en fonction de la pratique
  const getPratiqueIcon = (pratique: string) => {
    const icons: Record<string, string> = {
      'pédestre': '🚶',
      'trail': '🏃',
      'VTT': '🚵',
      'cyclo': '🚴',
      'gravel': '🚲',
      'équestre': '🐎',
      'ski de fond': '⛷️',
      'ski de rando': '🎿',
      'raquettes': '❄️'
    };
    return icons[pratique] || '➡️';
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`mb-3 rounded-lg border transition-all duration-200
                ${isHighlighted 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-[0_5px_10px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,0.8)_inset] transform translate-y-[-2px]' 
                  : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-50 shadow-[0_3px_6px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,0.8)_inset]'}`}
      onMouseEnter={() => onHover(hike.id_local)}
      onMouseLeave={() => onHover('')}
      data-hike-id={hike.id_local}
    >
      {/* Header de la carte avec titre et badges */}
      <div 
        className="p-3 cursor-pointer" 
        onClick={toggleExpand}
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
            {hike.nom_itineraire}
          </h3>
          <button 
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColor(hike.difficulte)} shadow-[0_1px_2px_rgba(0,0,0,0.05)]`}>
            {hike.difficulte}
          </span>
          
          {hike.pratique && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {getPratiqueIcon(hike.pratique)} {hike.pratique}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-1 text-xs text-gray-600 bg-gray-50 p-1.5 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] mt-2">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(hike.duree)}
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {hike.denivele_positif}m
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {formatDistance(hike.longueur)}
          </div>
        </div>
      </div>
      
      {/* Section description - visible uniquement si la carte est dépliée */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1">
          <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
            <h4 className="font-medium mb-1">Description:</h4>
            <p className="whitespace-pre-line">
              {getShortDescription(hike.presentation_courte)}
              {isDescriptionTruncated(hike.presentation) && (
                <span className="text-gray-500 italic"> (...)</span>
              )}
            </p>
          </div>
          
          {hike.themes && hike.themes.length > 0 && (
            <div className="mt-2">
              <h4 className="text-xs font-medium mb-1">Thèmes:</h4>
              <div className="flex flex-wrap gap-1">
                {hike.themes.map((theme, idx) => (
                  <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hike);
              }}
              className="text-xs px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,0.2)_inset] hover:from-green-600 hover:to-green-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir détails
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 