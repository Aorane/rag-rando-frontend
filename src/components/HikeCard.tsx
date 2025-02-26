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

  const [isExpanded, setIsExpanded] = useState(false);

  // Fonction pour obtenir l'icône de la pratique
  const getPratiqueIcon = (pratique: string) => {
    const icons = {
      pédestre: '🚶',
      trail: '🏃',
      VTT: '🚵',
      cyclo: '🚴',
      gravel: '🚲',
      équestre: '🐎',
      'ski de fond': '⛷️',
      'ski de rando': '🎿',
      raquettes: '❄️',
      autre: '➡️'
    };
    return icons[pratique as keyof typeof icons] || '➡️';
  };

  return (
    <div
      className={`mb-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                ${isHighlighted 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-[0_5px_10px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,0.8)_inset] transform translate-y-[-2px]' 
                  : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-50 shadow-[0_3px_6px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,0.8)_inset]'}`}
      onMouseEnter={() => onHover(hike.id_local)}
      onMouseLeave={() => onHover('')}
      onClick={() => onSelect(hike)}
      data-hike-id={hike.id_local}
    >
      <div className="flex flex-col">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
          {hike.nom_itineraire}
        </h3>
        
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColor(hike.difficulte)} shadow-[0_1px_2px_rgba(0,0,0,0.05)]`}>
            {hike.difficulte}
          </span>
          
          {hike.pratique && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {hike.pratique}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-1 text-xs text-gray-600 bg-gray-50 p-1.5 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
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
    </div>
  );
} 