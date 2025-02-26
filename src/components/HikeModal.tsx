import { useState } from 'react';
import { HikeResult } from '@/types/search';
import { cleanText, formatDuration } from '@/utils/text';
// import Image from 'next/image';

interface HikeModalProps {
  hike: HikeResult;
  onClose: () => void;
}

export default function HikeModal({ hike, onClose }: HikeModalProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'carte' | 'infos'>('description');

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

  // Traduire les saisons en français
  const translateSeason = (season: string) => {
    const translations: Record<string, string> = {
      'spring': 'Printemps',
      'summer': 'Été',
      'autumn': 'Automne',
      'winter': 'Hiver'
    };
    return translations[season.toLowerCase()] || season;
  };

  const repareUrl = (url: string) => {
    const rUrl = url.replace('https://geotrek-admin.cevennes-parcnational.net/', 'https://geotrek-admin.cevennes-parcnational.net/media/')
    console.log(rUrl);
    return rUrl;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl flex flex-col relative"
        style={{ 
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2)' 
        }}
      >
        {/* Header avec titre et bouton de fermeture */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between shadow-md">
          <h2 className="text-lg md:text-xl font-bold">{hike.nom_itineraire}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Onglets de navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('description')}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors
                      ${activeTab === 'description' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Description
            {activeTab === 'description' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('infos')}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors
                      ${activeTab === 'infos' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Informations
            {activeTab === 'infos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('carte')}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors
                      ${activeTab === 'carte' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Carte
            {activeTab === 'carte' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        </div>
        
        {/* Contenu de la modale - partie onglet Description */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'description' && (
            <div className="p-4 md:p-6">
              {/* Données essentielles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 bg-gray-50 p-3 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded shadow-sm">
                  <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-500">Durée</span>
                  <span className="font-medium text-sm">{formatDuration(hike.duree)}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded shadow-sm">
                  <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs text-gray-500">Dénivelé</span>
                  <span className="font-medium text-sm">{hike.denivele_positif}m D+</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded shadow-sm">
                  <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-xs text-gray-500">Distance</span>
                  <span className="font-medium text-sm">{formatDistance(hike.longueur)}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded shadow-sm">
                  <svg className="w-5 h-5 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs text-gray-500">Difficulté</span>
                  <span className={`font-medium text-sm px-2 rounded-full mt-1 ${difficultyColor(hike.difficulte)}`}>
                    {hike.difficulte}
                  </span>
                </div>
              </div>
              
              {/* Description complète */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-base font-medium mb-3 text-gray-800">Description du parcours</h3>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {hike.description || "Aucune description disponible pour cette randonnée."}
                </div>
              </div>
              
              {/* Thèmes et pratique */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {hike.themes && hike.themes.length > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-base font-medium mb-3 text-gray-800">Thèmes</h3>
                    <div className="flex flex-wrap gap-2">
                      {hike.themes.map((theme, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {hike.pratique && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-base font-medium mb-3 text-gray-800">Pratique</h3>
                    <div className="text-sm text-gray-700">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">
                        {hike.pratique}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image si disponible */}
              {hike.image && (
                <div className="mb-6">
                  <h3 className="text-base font-medium mb-3 text-gray-800">Photos</h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                    <img 
                      src={hike.image} 
                      alt={hike.nom_itineraire} 
                      className="w-full h-auto object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Contenu de la modale - partie onglet Informations */}
          {activeTab === 'infos' && (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Saisons recommandées */}
                {hike.saisons && hike.saisons.length > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-base font-medium mb-3 text-gray-800">Saisons recommandées</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['spring', 'summer', 'autumn', 'winter'].map((season) => (
                        <div 
                          key={season}
                          className={`flex flex-col items-center p-2 rounded ${
                            hike.saisons?.includes(season) 
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 border border-gray-200 opacity-50'
                          }`}
                        >
                          {season === 'spring' && '🌱'}
                          {season === 'summer' && '☀️'}
                          {season === 'autumn' && '🍂'}
                          {season === 'winter' && '❄️'}
                          <span className="text-xs mt-1">{translateSeason(season)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Accessibilité */}
                {hike.accessible && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-base font-medium mb-3 text-gray-800">Accessibilité</h3>
                    <div className="flex flex-wrap gap-2">
                      {hike.accessible.map((access, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                          {access}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Localisation */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-base font-medium mb-3 text-gray-800">Localisation</h3>
                  <div className="space-y-2 text-sm">
                    {hike.commune && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{hike.commune}</span>
                      </div>
                    )}
                    {hike.depart && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>Départ: {hike.depart}</span>
                      </div>
                    )}
                    {hike.arrivee && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Arrivée: {hike.arrivee}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Type de parcours */}
                {hike.parcours && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-base font-medium mb-3 text-gray-800">Type de parcours</h3>
                    <div className="flex items-center">
                      {hike.parcours === 'Boucle' && (
                        <>
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Boucle</span>
                        </>
                      )}
                      {hike.parcours === 'Aller-retour' && (
                        <>
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          <span>Aller-retour</span>
                        </>
                      )}
                      {hike.parcours === 'Itinérance' && (
                        <>
                          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span>Itinérance</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Recommandations et conseils */}
              <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-base font-medium mb-3 text-gray-800">Recommandations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center p-2 bg-orange-50 rounded border border-orange-200">
                    <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs">Prévoir de l'eau en quantité suffisante</span>
                  </div>
                  <div className="flex items-center p-2 bg-blue-50 rounded border border-blue-200">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs">Consulter la météo avant de partir</span>
                  </div>
                  <div className="flex items-center p-2 bg-green-50 rounded border border-green-200">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs">Respect de l'environnement et des sentiers</span>
                  </div>
                  <div className="flex items-center p-2 bg-purple-50 rounded border border-purple-200">
                    <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <span className="text-xs">Vérifier les conditions d'accès (périodes)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Contenu de la modale - partie onglet Carte */}
          {activeTab === 'carte' && (
            <div className="p-4 h-[60vh] flex flex-col">
              <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm flex-1 flex items-center justify-center">
                <div className="text-center p-4">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-gray-600">Carte détaillée de la randonnée</p>
                  <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 transition-colors">
                    Télécharger la trace GPX
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer avec boutons d'action */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fermer
          </button>
          <div className="flex gap-3">
            <a 
              href="#" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
              title="Télécharger la fiche"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </a>
            <a 
              href="#" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center gap-1"
              title="Ajouter à mes favoris"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favoris
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 