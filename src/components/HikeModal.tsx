import { HikeResult } from '@/types/search';
import { cleanText, formatDuration } from '@/utils/text';
import Image from 'next/image';

interface HikeModalProps {
  hike: HikeResult;
  onClose: () => void;
}

export default function HikeModal({ hike, onClose }: HikeModalProps) {

  const repareUrl= (url:string)=>{
    const rUrl= url.replace('https://geotrek-admin.cevennes-parcnational.net/', 'https://geotrek-admin.cevennes-parcnational.net/media/')
    console.log(rUrl);
    return rUrl;
  }
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">

        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {hike.nom_itineraire}
                </h3>
                <div className="mt-4 space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Description</h4>
                    <p className="text-gray-600 whitespace-pre-line">
                      {cleanText(hike.presentation)}
                    </p>
                  </div>

                  {/* Instructions de randonnée */}
                  {hike.instructions && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9 5l7 7-7 7" />
                        </svg>
                        Pas à pas
                      </h4>
                      <div className="space-y-4">
                        {cleanText(hike.instructions).split('\n').filter(Boolean).map((instruction, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700
                                          flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <p className="text-gray-600 flex-1">
                              {instruction}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations techniques */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700">Informations techniques</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li>Distance : {(hike.longueur / 1000).toFixed(1)} km</li>
                        <li>Dénivelé : {hike.denivele_positif}m D+</li>
                        {hike.altitude_min && hike.altitude_max && (
                          <li>
                            Altitude : {hike.altitude_min}m - {hike.altitude_max}m
                          </li>
                        )}
                        {hike.duree && <li>Durée estimée : {formatDuration(hike.duree)}</li>}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700">Accès</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        {hike.acces_routier && (
                          <li>
                            <strong>Routier :</strong> {cleanText(hike.acces_routier)}
                          </li>
                        )}
                        {hike.parking_info && (
                          <li>
                            <strong>Parking :</strong> {cleanText(hike.parking_info)}
                          </li>
                        )}
                        {hike.transports_commun && (
                          <li>
                            <strong>Transports :</strong>{' '}
                            {cleanText(hike.transports_commun)}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Médias */}
                  {hike.medias && hike.medias.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700">Photos</h4>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {hike.medias.filter(m => m.type_media === 'image').map((media, index) => (
                          <div key={index} className="relative aspect-video">
                            <img
                              src={repareUrl(media.url)}
                              alt={media.titre || 'Photo de la randonnée'}
                              className="object-cover rounded-lg"
                            />
                            {media.legende && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                                {media.legende}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 