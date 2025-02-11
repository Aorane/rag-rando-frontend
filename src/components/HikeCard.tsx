import { useState } from 'react';
import { HikeResult } from '@/types/search';
import { cleanText, formatDuration, getDifficultyColor } from '@/utils/text';

interface HikeCardProps {
  hike: HikeResult;
  onHover: (id: string | null) => void;
  onSelect: (hike: HikeResult) => void;
  isHighlighted?: boolean;
}

export default function HikeCard({ hike, onHover, onSelect, isHighlighted }: HikeCardProps) {
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
      className={`p-4 transition-all duration-200 cursor-pointer border-b last:border-b-0
                ${isHighlighted 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'hover:bg-gray-50'}`}
      onMouseEnter={() => onHover(hike.id_local)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(hike)}
    >
      <div className={`space-y-3 ${isExpanded ? 'pb-4' : ''}`}>
        {/* En-tête avec titre et actions */}
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-lg group-hover:text-green-700 transition-colors">
            {hike.nom_itineraire}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-2xl" title={hike.pratique}>
              {getPratiqueIcon(hike.pratique)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Badges d'information */}
        <div className="flex flex-wrap gap-2 text-sm">
          {/* {hike.note_moyenne && (
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              ★ {hike.note_moyenne.toFixed(1)}
            </span>
          )} */}
          <span className={`px-2 py-1 rounded-full ${getDifficultyColor(hike.difficulte)}`}>
            {hike.difficulte}
          </span>
          {hike.saison_recommandee && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              {hike.saison_recommandee}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            {hike.denivele_positif}m D+
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            {(hike.longueur / 1000).toFixed(1)}km
          </span>
          {hike.duree && (
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              {formatDuration(hike.duree)}
            </span>
          )}
        </div>

        {/* Description courte toujours visible */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {cleanText(hike.presentation_courte || hike.presentation.slice(0, 200) + '...')}
        </p>

        {/* Contenu expansible */}
        <div
          className={`space-y-4 overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[500px]' : 'max-h-0'
          }`}
        >
          {/* Informations détaillées */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {hike.coordonnees_depart && (
              <div>
                <strong className="block text-gray-700">Départ</strong>
                <span className="text-gray-600">{cleanText(hike.depart)}</span>
                <span className="text-xs text-gray-500 block">
                  {hike.coordonnees_depart.lat.toFixed(4)}, {hike.coordonnees_depart.lon.toFixed(4)}
                </span>
              </div>
            )}
            <div>
              <strong className="block text-gray-700">Arrivée</strong>
              <span className="text-gray-600">{cleanText(hike.arrivee)}</span>
            </div>
            {hike.balisage && (
              <div>
                <strong className="block text-gray-700">Balisage</strong>
                <span className="text-gray-600">{cleanText(hike.balisage)}</span>
              </div>
            )}
            {hike.communes_nom && (
              <div>
                <strong className="block text-gray-700">Communes</strong>
                <span className="text-gray-600">{cleanText(hike.communes_nom)}</span>
              </div>
            )}
          </div>

          {/* Thèmes */}
          {hike.themes && (
            <div className="flex flex-wrap gap-2">
              {hike.themes.split(',').map((theme) => (
                <span
                  key={theme}
                  className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                >
                  {cleanText(theme.trim())}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 