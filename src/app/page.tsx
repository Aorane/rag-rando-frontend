'use client';

import { useState, useRef, useEffect } from 'react';
// import Image from 'next/image';
import CevennesMap from '@/components/Map';
import HikeCard from '@/components/HikeCard';
import HikeModal from '@/components/HikeModal';
import ChatInterface from '@/components/ChatInterface';
import { searchHikes } from '@/services/api';
import type { SearchResponse, HikeResult, Message } from '@/types/search';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [selectedHike, setSelectedHike] = useState<HikeResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling,] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant de randonnée dans les Cévennes. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [context, setContext] = useState<Record<string, unknown>>({});

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);

    try {
      const results = await searchHikes(query, chatMessages, context);
      setSearchResults(results);
      // Si c'est la première requête, stocker l'ID de conversation
      if (!context && results.context) {
        setContext(results.context);
      }
    } catch (err) {
      console.error("Une erreur s'est produite lors de la recherche.", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Ajouter le message de l'utilisateur au chat
    const updatedMessages = [
      ...chatMessages, 
      { role: 'user' as const, content: message }
    ];
    
    setChatMessages(updatedMessages);
    setIsSearching(true);
    
    try {
      // Lancer la recherche avec tous les messages et le contexte
      const results = await searchHikes(message, updatedMessages, context);
      
      // Mettre à jour les résultats
      setSearchResults(results);
      
      // Stocker le nouveau contexte
      setContext(results.context || {});
      
      // Extraire le message de réponse formaté pour l'affichage
      let responseMessage = "";
      
      if (results.response && typeof results.response === 'object' && results.response.summary) {
        // Utiliser directement l'objet response pour l'affichage
        const assistantMessage: Message = { 
          role: 'assistant' as const, 
          content: results.response 
        };
        setChatMessages([...updatedMessages, assistantMessage]);
      } else if (typeof results.response === 'string') {
        // Si la réponse est une chaîne directe
        responseMessage = results.response;
        setChatMessages([...updatedMessages, { 
          role: 'assistant' as const, 
          content: responseMessage
        }]);
      } else if (Array.isArray(results.messages) && results.messages.length > 0) {
        // Utiliser uniquement les messages de l'API s'ils existent
        setChatMessages(results.messages);
      } else {
        // Message par défaut
        responseMessage = "J'ai trouvé quelques randonnées qui pourraient vous intéresser.";
        setChatMessages([...updatedMessages, { 
          role: 'assistant' as const, 
          content: responseMessage
        }]);
      }
    } catch (err) {
      console.error("Une erreur s'est produite lors de la recherche.", err);
      setChatMessages([...updatedMessages, { 
        role: 'assistant' as const, 
        content: "Désolé, j'ai rencontré un problème lors de la recherche. Veuillez réessayer." 
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fonction pour faire défiler jusqu'à la randonnée
  const scrollToHike = (hikeId: string) => {
    if (!resultsRef.current || isUserScrolling) return;

    const hikeElement = resultsRef.current.querySelector(`[data-hike-id="${hikeId}"]`);
    if (hikeElement) {
      // Calculer la position de défilement dans le conteneur
      const container = resultsRef.current;
      const elementTop = (hikeElement as HTMLElement).offsetTop;
      const containerHeight = container.clientHeight;

      // Centrer l'élément dans le conteneur de défilement
      const targetScroll = elementTop - containerHeight / 2 + (hikeElement as HTMLElement).clientHeight / 2;

      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Effet pour gérer le défilement automatique lors du survol sur la carte
  useEffect(() => {
    if (hoveredTrailId && !isUserScrolling) {
      scrollToHike(hoveredTrailId);
    }
  }, [hoveredTrailId, isUserScrolling, scrollToHike]);

  return (
    <main className=" h-screen">
      {/* Header Navigation - Design amélioré et plus impactant */}
      <header className="flex m-auto">
 
      </header>

      {/* Main Content avec Hero amélioré */}
      <div className="h-full content-center  ">

        {/* Section principale avec Map et Résultats */}
        <section className=" h-[80vh] relative">
          {/* Grille responsive */}
          <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Indicateur de panneau glissant sur mobile */}
            <div
              className={`
                fixed bottom-0 left-0 right-0 z-20 md:hidden
                ${isPanelVisible ? 'hidden' : 'block'}
              `}
            >
              {/* Barre d'aperçu du panneau avec résumé */}
              <div
                className="bg-white rounded-t-xl shadow-lg"
                onClick={() => setIsPanelVisible(true)}
              >
                <div className="flex justify-center py-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Panneau latéral avec gestion responsive */}
            <div
              className={`
                fixed inset-x-0 bottom-0 z-30 md:relative md:col-span-4
                bg-white md:bg-transparent
                transform transition-transform duration-300 ease-in-out
                ${isPanelVisible ? 'translate-y-0' : 'translate-y-[92%] md:translate-y-0'}
                  h-full flex flex-col
                rounded-t-2xl md:rounded-none  md:shadow-none 
              `}
            >
 

              {/* Contenu du panneau */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white shadow-[rgba(0,0,15,0.5)_5px_5px_4px_0px] ">
 

                {/* Onglets */}
                <div className="flex border-b border-gray-200 bg-white">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-medium relative transition-colors duration-200
                               ${activeTab === 'chat'
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Chat
                    {activeTab === 'chat' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`flex-1 py-3 text-sm font-medium relative transition-colors duration-200
                               ${activeTab === 'results'
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Résultats
                    {activeTab === 'results' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                    )}
                  </button>
                </div>

                {/* Contenu des onglets */}
                <div className="flex-1 overflow-hidden relative bg-gray-50">
                  <div className={`absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto
                                  ${activeTab === 'chat' ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Contenu Chat */}
                    <ChatInterface 
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      isLoading={isSearching}
                    />
                  </div>

                  <div className={`absolute inset-0 transition-transform duration-300 ease-in-out
                                  ${activeTab === 'results' ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Contenu Résultats */}
                    <div className="p-4 sticky top-0 bg-white border-b z-10">
                      <h2 className="text-lg font-semibold text-gray-800">Randonnées suggérées</h2>
                      {searchResults && (
                        <p className="text-sm text-gray-600 mt-1">
                          {searchResults.results.length} résultats trouvés
                        </p>
                      )}
                    </div>

                    <div className="p-2">
                      {searchResults?.results.map((hike) => (
                        <HikeCard
                          key={hike.id_local}
                          hike={hike}
                          onHover={(id) => setHoveredTrailId(id)}
                          onSelect={(h) => setSelectedHike(h)}
                          isHighlighted={hoveredTrailId === hike.id_local}
                        />
                      ))}
                      
                      {searchResults && searchResults.results.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          Aucune randonnée trouvée. Essayez de modifier vos critères.
                        </div>
                      )}
                      
                      {!searchResults && (
                        <div className="p-4 text-center text-gray-500">
                          Utilisez le chat pour trouver des randonnées adaptées à vos envies.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay sombre quand le panneau est ouvert sur mobile */}
            {isPanelVisible && (
              <div
                className="fixed inset-0 bg-black/30  z-20 md:hidden"
                onClick={() => setIsPanelVisible(false)}
              />
            )}

            {/* Carte */}
            <div className="col-span-1 md:col-span-8 relative h-full">
              <CevennesMap
                hikingPoints={searchResults?.results.map(hike => ({
                  id: hike.id_local,
                  coordinates: hike.geometry.coordinates,
                  name: hike.nom_itineraire,
                  difficulty: hike.difficulte,
                  duration: hike.duree,
                  distance: hike.longueur,
                  elevation: hike.denivele_positif
                }))}
                hoveredTrailId={hoveredTrailId}
                onHover={setHoveredTrailId}
              />
            </div>
          </div>
        </section>

        {selectedHike && (
          <HikeModal
            hike={selectedHike}
            onClose={() => setSelectedHike(null)}
          />
        )}

        {/* Footer minimaliste */}
        <footer className=" ">
 
        </footer>
      </div>
    </main>
  );
}
