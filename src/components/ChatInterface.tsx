'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, HikeResult, ProfilePoint } from '@/types/search';
import type { AltitudeProfile } from '@/types/search';
import { FiSend, FiMapPin, FiClock, FiArrowUp, FiArrowDown, FiStar, FiChevronLeft, FiChevronRight, FiTrendingUp, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

// Types
interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

interface SuggestionProps {
  text: string;
  onClick: () => void;
}

type DifficultyColor = {
  [key in 'facile' | 'moyen' | 'difficile' | 'très difficile']: string;
};

// Suggestions prédéfinies
const DEFAULT_SUGGESTIONS = [
  "Randonnée facile près de Florac",
  "Circuit avec des cascades et des rivières",
  "Randonnée familiale de moins de 3h",
  "Parcours panoramique dans les Cévennes"
];

// Composants réutilisables
const Suggestion: React.FC<SuggestionProps> = ({ text, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="px-4 py-2 m-1 text-sm bg-green-50 text-green-700 rounded-full hover:bg-green-100 
               transition-colors duration-200 flex items-center space-x-2"
    onClick={onClick}
  >
    <FiMapPin className="w-4 h-4" />
    <span>{text}</span>
  </motion.button>
);

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const colors: DifficultyColor = {
    'facile': 'bg-green-100 text-green-800',
    'moyen': 'bg-yellow-100 text-yellow-800',
    'difficile': 'bg-orange-100 text-orange-800',
    'très difficile': 'bg-red-100 text-red-800'
  };
  
  const colorClass = colors[difficulty.toLowerCase() as keyof DifficultyColor] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {difficulty}
    </span>
  );
};

// Composant du carrousel d'images
const ImageCarousel: React.FC<{ medias: any[] }> = ({ medias }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % medias.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + medias.length) % medias.length);
  };

    return (
    <div className="relative w-full h-48 bg-gray-100">
      {/* Image courante */}
      <Image
        src={medias[currentIndex].url.replace('https://geotrek-admin.cevennes-parcnational.net/', 'https://geotrek-admin.cevennes-parcnational.net/media/')}
        alt={medias[currentIndex].titre || 'Image de randonnée'}
        fill
        className="object-cover transition-opacity duration-300"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* Contrôles de navigation */}
      {medias.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full 
                     hover:bg-opacity-70 transition-all duration-200"
            aria-label="Image précédente"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full 
                     hover:bg-opacity-70 transition-all duration-200"
            aria-label="Image suivante"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicateurs de position */}
      {medias.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
          {medias.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Crédits photo */}
      {medias[currentIndex].auteur && (
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 m-2 rounded">
          © {medias[currentIndex].auteur}
        </div>
      )}
    </div>
  );
};

// Composant pour afficher le profil altimétrique
const AltitudeProfile: React.FC<{ profile: AltitudeProfile }> = ({ profile }) => {
  // Préparation des données pour le graphique
  const data = profile.points.map((point: ProfilePoint) => ({
    distance: point.distance,  // Conversion en km, conservé comme nombre
    altitude: point.altitude
  }));

  // Sélectionner un sous-ensemble de points pour un affichage plus fluide
  // Essayer d'avoir environ 100-150 points pour un bon rendu
  const sampleRate = Math.max(1, Math.ceil(data.length / 120));
  const sampledData = data.filter((_: any, index: number) => index % sampleRate === 0);

  // Calculer les valeurs min et max pour les marges du graphique
  const minAltitude = profile.min_altitude - 50; // Marge de 50m en bas
  const maxAltitude = profile.max_altitude + 50; // Marge de 50m en haut

  return (
    <div className="h-32 w-full    rounded-lg overflow-hidden p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sampledData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
          <XAxis 
            dataKey="distance" 
            domain={[0, profile.total_distance / 1000]}
            tickFormatter={(value) => `${value.toFixed(1)}`}
            tick={{ fontSize: 10 }}
            label={{ value: 'km', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis 
            domain={[minAltitude, maxAltitude]}
            tickFormatter={(value) => `${value}m`}
            tick={{ fontSize: 10 }}
            width={35}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}m`, 'Altitude']}
            labelFormatter={(label: number) => `Distance: ${label.toFixed(1)} km`}
            contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
          />
          <defs>
            <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.8} />
              <stop offset="90%" stopColor="#bbf7d0" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="altitude" 
            stroke="#16a34a" 
            strokeWidth={2}
            fill="url(#altitudeGradient)"
            activeDot={{ r: 4 }}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const HikeCard: React.FC<{ hike: HikeResult }> = ({ hike }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden focus:outline-none border border-gray-100 group"
  >
    {/* Section supérieure : Image avec overlay complet */}
    <div className="relative h-48">
      {/* Image ou gradient */}
      {hike.medias && hike.medias.length > 0 ? (
        <div className="absolute inset-0">
          <ImageCarousel medias={hike.medias} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 opacity-75"></div>
      )}
      
      {/* Overlay de protection pour le texte */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
      
      {/* Badge de difficulté */}
      <div className="absolute top-4 right-4 z-10">
        <DifficultyBadge difficulty={hike.difficulte || 'Non spécifié'} />
      </div>

      {/* Badges d'accessibilité */}
      {hike.accessibilite && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {hike.accessibilite.pmr && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full backdrop-blur-sm">
              <span className="text-xs font-medium text-gray-800">PMR</span>
            </div>
          )}
          {hike.accessibilite.poussette && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full backdrop-blur-sm">
              <span className="text-xs font-medium text-gray-800">Poussette</span>
            </div>
          )}
        </div>
      )}

      {/* Informations titre et localisation */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="space-y-1">
          <h3 className="font-bold text-xl text-white leading-tight">
            {hike.nom_itineraire}
          </h3>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <FiMapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{hike.communes_nom || 'Localisation non spécifiée'}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Section inférieure : Contenu informatif */}
    <div className="p-5 space-y-4">
      {/* Caractéristiques principales en ligne avec icônes améliorées */}
      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors">
          <FiMapPin className="w-5 h-5 text-green-600 mb-1.5" />
          <div className="text-center">
            <span className="block font-bold text-sm text-gray-800">{(hike.longueur / 1000).toFixed(1)} km</span>
            <span className="block text-xs text-gray-500">Distance</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors">
          <FiClock className="w-5 h-5 text-green-600 mb-1.5" />
          <div className="text-center">
            <span className="block font-bold text-sm text-gray-800">{hike.duree ? `${hike.duree.toFixed(1)}h` : '-'}</span>
            <span className="block text-xs text-gray-500">Durée</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors">
          <FiArrowUp className="w-5 h-5 text-green-600 mb-1.5" />
          <div className="text-center">
            <span className="block font-bold text-sm text-gray-800">+{hike.denivele_positif || 0}m</span>
            <span className="block text-xs text-gray-500">Dénivelé</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors">
          <FiArrowDown className="w-5 h-5 text-green-600 mb-1.5" />
          <div className="text-center">
            <span className="block font-bold text-sm text-gray-800">{hike.altitude_max || 0}m</span>
            <span className="block text-xs text-gray-500">Alt. max</span>
          </div>
        </div>
      </div>

      {/* Séparateur avec info de type */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-grow h-px bg-gray-100"></div>
        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
          {hike.type_itineraire || 'Parcours'}
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
          {hike.pratique || 'Randonnée'}
        </div>
        <div className="flex-grow h-px bg-gray-100"></div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-2 gap-4">
        {/* Première colonne : Profil altimétrique */}
        {hike.profil_altimetrique ? (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-2">
            <div className="flex items-center gap-2 mb-1">
              <FiTrendingUp className="text-green-600 w-4 h-4" />
              <span className="text-xs font-medium text-gray-700">Profil altimétrique</span>
            </div>
            <div className="h-24">
              {hike.profil_altimetrique.points && hike.profil_altimetrique.points.length > 0 ? (
                <AltitudeProfile profile={hike.profil_altimetrique} />
              ) : hike.profil_altimetrique.image ? (
                <img
                  src={hike.profil_altimetrique.image}
                  alt="Profil altimétrique"
                  className="w-full h-full object-contain"
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-2">
              <FiInfo className="text-gray-400 w-4 h-4 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-700">Description</span>
                <p className="text-xs text-gray-600 line-clamp-4 mt-1">
                  {hike.presentation_courte || "Aucune description disponible pour cette randonnée."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deuxième colonne : Informations pratiques */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-4">
          <div className="space-y-2">
            {hike.depart && (
              <div className="flex gap-2 items-start">
                <div className="w-4 h-4 mt-0.5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Départ</span>
                  <p className="text-xs text-gray-700">{hike.depart}</p>
                </div>
              </div>
            )}
            {hike.arrivee && (
              <div className="flex gap-2 items-start">
                <div className="w-4 h-4 mt-0.5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Arrivée</span>
                  <p className="text-xs text-gray-700">{hike.arrivee}</p>
                </div>
              </div>
            )}
            {hike.balisage && (
              <div className="flex gap-2 items-start">
                <div className="w-4 h-4 mt-0.5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Balisage</span>
                  <p className="text-xs text-gray-700">{hike.balisage}</p>
                </div>
              </div>
            )}
            {hike.type_sol && (
              <div className="flex gap-2 items-start">
                <div className="w-4 h-4 mt-0.5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Type de sol</span>
                  <p className="text-xs text-gray-700">{hike.type_sol}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Information de parking/transport condensée */}
      {(hike.parking_info || hike.acces_routier || hike.transports_commun) && (
        <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2.5">
          <FiInfo className="text-blue-500 w-4 h-4 flex-shrink-0" />
          <span className="text-blue-800">
            {hike.parking_info ? "Parking disponible" : ""}
            {hike.parking_info && (hike.acces_routier || hike.transports_commun) ? " • " : ""}
            {hike.acces_routier ? "Accès routier" : ""}
            {hike.acces_routier && hike.transports_commun ? " • " : ""}
            {hike.transports_commun ? "Transports en commun" : ""}
          </span>
        </div>
      )}

      {/* Thèmes en ligne */}
      {hike.themes && typeof hike.themes === 'string' && hike.themes.trim() !== '' && (
        <div className="flex flex-wrap gap-1.5">
          {hike.themes.split(',').map((theme: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg">
              {theme.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Recommandation si disponible */}
      {hike.recommandations && (
        <div className="bg-amber-50 rounded-lg p-2.5 flex items-start gap-2">
          <FiAlertTriangle className="text-amber-500 w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 line-clamp-2">{hike.recommandations}</p>
        </div>
      )}
    </div>
  </motion.div>
);


// Composant principal
export default function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll automatique
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gestion de la hauteur du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Gestion des suggestions dynamiques
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && typeof lastMessage.content === 'object') {
        const newSuggestions = [];
        if (lastMessage.content.synthese) {
          newSuggestions.push(`Plus de randonnées comme celle-ci`);
        }
        setSuggestions([...DEFAULT_SUGGESTIONS.slice(0, 2), ...newSuggestions]);
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (typeof msg.content === 'string') {
              return (
        <div className="prose prose-green max-w-none">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      );
    }
    
    // Message avec ou sans recherche
    return (
      <div className="space-y-4">
        {/* Message principal */}
        <div className="prose prose-green max-w-none">
          <ReactMarkdown>{msg.content.response}</ReactMarkdown>
        </div>
        
        {/* Bloc de résultats si présent */}
        {msg.content.synthese && (
          <div className="mt-4">
            {/* Synthèse discrète */}
            <p className="text-sm text-gray-600 italic mb-4">{msg.content.synthese}</p>

            {/* Randonnées recommandées */}
            {msg.content.recommandations && msg.content.recommandations.length > 0 && (
              <div className="space-y-4">
                {msg.content.recommandations.map((hike: HikeResult, index: number) => (
                  <HikeCard key={hike.id_local + index} hike={hike} />
                ))}
          </div>
        )}
        
            {/* Conclusion si présente */}
            {msg.content.conclusion && (
              <p className="text-sm text-gray-600 italic mt-4">{msg.content.conclusion}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white px-4 py-3'
                    : 'bg-white shadow-md px-4 py-3'
                }`}
              >
                {renderMessageContent(msg)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Zone des suggestions */}
      {!isLoading && messages.length < 10 && (
        <div className="px-4 py-2 flex flex-wrap justify-center">
            {suggestions.map((suggestion, index) => (
            <Suggestion
                key={index}
              text={suggestion}
                onClick={() => onSendMessage(suggestion)}
            />
          ))}
        </div>
      )}
      
      {/* Zone de saisie */}
      <form onSubmit={handleSubmit} className="p-4 bg-white shadow-lg">
        <div className="relative flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Décrivez la randonnée que vous recherchez..."
            className="flex-1 max-h-32 p-3 bg-gray-50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`p-3 rounded-lg ${
              isLoading || !inputValue.trim()
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } transition-colors duration-200`}
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 