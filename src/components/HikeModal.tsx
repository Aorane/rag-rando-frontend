import { HikeResult } from '@/types/search';
import { cleanText, formatDuration } from '@/utils/text';
// import Image from 'next/image';

interface HikeModalProps {
  hike: HikeResult;
  onClose: () => void;
}

export default function HikeModal({ hike, onClose }: HikeModalProps) {
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

  const repareUrl = (url: string) => {
    const rUrl = url.replace('https://geotrek-admin.cevennes-parcnational.net/', 'https://geotrek-admin.cevennes-parcnational.net/media/')
    console.log(rUrl);
    return rUrl;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Entête avec image de couverture */}
          <div className="relative h-40 bg-gradient-to-r from-green-500 to-green-600">
            {hike.photo_couverture ? (
              <img 
                src={hike.photo_couverture} 
                alt={hike.nom_itineraire} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-white/20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L8 3M8 3L13 8M8 3V17M21 16L16 21M16 21L11 16M16 21V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Titre */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-xl font-bold text-white">{hike.nom_itineraire}</h2>
            </div>
            
            {/* Bouton fermer */}
            <button 
              onClick={onClose}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Contenu */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
            {/* Informations principales */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex flex-col items-center text-center">
                <div className="text-sm text-gray-500">Durée</div>
                <div className="font-medium">{formatDuration(hike.duree)}</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-sm text-gray-500">Distance</div>
                <div className="font-medium">{formatDistance(hike.longueur)}</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-sm text-gray-500">Dénivelé</div>
                <div className="font-medium">+{hike.denivele_positif}m</div>
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 text-sm rounded-md bg-green-100 text-green-800">{hike.difficulte}</span>
              {hike.pratique && (
                <span className="px-2 py-1 text-sm rounded-md bg-blue-100 text-blue-800">{hike.pratique}</span>
              )}
              {hike.themes && hike.themes.map((theme, i) => (
                <span key={i} className="px-2 py-1 text-sm rounded-md bg-purple-100 text-purple-800">{theme}</span>
              ))}
            </div>
            
            {/* Description */}
            {hike.description && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-line text-sm">{hike.description}</p>
              </div>
            )}
            
            {/* Recommandations */}
            {hike.recommandations && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Recommandations</h3>
                <p className="text-gray-700 whitespace-pre-line text-sm">{hike.recommandations}</p>
              </div>
            )}
            
            {/* Informations techniques */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Informations techniques</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {hike.altitude_maximum && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Altitude max:</span>
                    <span>{hike.altitude_maximum}m</span>
                  </div>
                )}
                {hike.altitude_minimum && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Altitude min:</span>
                    <span>{hike.altitude_minimum}m</span>
                  </div>
                )}
                {hike.denivele_negatif && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dénivelé -:</span>
                    <span>{hike.denivele_negatif}m</span>
                  </div>
                )}
                {hike.type_sol && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type sol:</span>
                    <span>{Array.isArray(hike.type_sol) ? hike.type_sol.join(', ') : hike.type_sol}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fermer
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Itinéraire complet</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 