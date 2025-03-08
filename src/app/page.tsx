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
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [selectedHike, setSelectedHike] = useState<HikeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResultsPanelExpanded, setIsResultsPanelExpanded] = useState(false);
  const [isMobilePanelVisible, setIsMobilePanelVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant de randonnée dans les Cévennes. Comment puis-je vous aider à trouver la randonnée qui vous correspond ?'
    }
  ]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (message: string) => {
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: message }];
    setChatMessages(updatedMessages);
    setIsLoading(true);
    
    try {
      const resultats = searchResults?.results;
      const response = await searchHikes(message, updatedMessages, resultats);
      console.log('response', response);

      // On laisse le message tel que retourné par l'API
      const enrichedMessage: Message = {
        role: 'assistant',
        content: {
          response: response.response,
          synthese: response.context.synthese,
          conclusion: response.context.conclusion
        }
      };
      
      setChatMessages([...updatedMessages, response.messages[response.messages.length - 1]]);
      setSearchResults(response);
    } catch (err) {
      console.error("Une erreur s'est produite lors de la recherche.", err);
      setChatMessages([...updatedMessages, { 
        role: 'assistant', 
        content: "Désolé, j'ai rencontré un problème lors de la recherche. Veuillez réessayer." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour faire défiler jusqu'à la randonnée sélectionnée
  const scrollToHike = (hikeId: string) => {
    if (!resultsRef.current) return;
    if (!isResultsPanelExpanded) setIsResultsPanelExpanded(true);

    const hikeElement = resultsRef.current.querySelector(`[data-hike-id="${hikeId}"]`);
    if (hikeElement) {
      const container = resultsRef.current;
      const elementTop = (hikeElement as HTMLElement).offsetTop;
      const containerHeight = container.clientHeight;
      container.scrollTo({
        top: elementTop - containerHeight / 2 + (hikeElement as HTMLElement).clientHeight / 2,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (hoveredTrailId) scrollToHike(hoveredTrailId);
  }, [hoveredTrailId]);

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-white">
      {/* Header simplifié */}
      <header className="relative z-0 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none">
              <path d="M4 12L8 8L12 12L16 8L20 12M4 16L8 12L12 16L16 12L20 16" 
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Cévennes Rando</h1>
              <p className="text-xs text-gray-500 -mt-1">Explorez le parc national</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteneur principal */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-gray-200">
        {/* Chat */}
        <div className={`col-span-12 md:col-span-3 lg:col-span-4 bg-white overflow-hidden flex flex-col relative
                      shadow-lg z-30 ${!isResultsPanelExpanded ? 'md:col-span-5 lg:col-span-6' : ''}`}>
          <div className="p-2 border-b">
            <h2 className="text-sm font-medium text-black text-center">Conversation</h2>
          </div>
          <ChatInterface 
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
        
        {/* Liste des résultats */}
        {/* <div className={`
          ${isResultsPanelExpanded ? 'md:block md:col-span-3 lg:col-span-4' : 'md:block md:col-span-1 lg:col-span-1'} 
          bg-white overflow-hidden flex flex-col relative shadow-lg z-20 transition-all duration-300`}>
          <div className="p-2 border-b flex justify-between items-center">
            <button 
              onClick={() => setIsResultsPanelExpanded(!isResultsPanelExpanded)}
              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 bg-gray-100 rounded-full"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={isResultsPanelExpanded ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-black">
              {searchResults ? `Résultats (${searchResults.results.length})` : 'Résultats'}
            </h2>
          </div>
          <div ref={resultsRef} className={`h-full overflow-y-auto p-2 custom-scrollbar ${isResultsPanelExpanded ? 'block' : 'hidden md:block md:opacity-0'}`}>
            {searchResults?.results.map((hike) => (
              <HikeCard
                key={hike.id_local}
                hike={hike}
                onHover={setHoveredTrailId}
                onSelect={setSelectedHike}
                isHighlighted={hoveredTrailId === hike.id_local}
              />
            ))}
            {!searchResults?.results.length && (
              <div className="p-4 text-center text-gray-500">
                {searchResults ? "Aucune randonnée trouvée." : "Utilisez le chat pour trouver des randonnées."}
              </div>
            )}
          </div>
        </div> */}
        
        {/* Carte */}
        <div className={`col-span-12 md:col-span-6 lg:col-span-4 relative shadow-lg z-10  
                      ${!isResultsPanelExpanded ? 'md:col-span-6 lg:col-span-5' : ''}`}>
                        
          <CevennesMap
            randonnees={searchResults?.results
              .map(rando => {
                return ({
                id_local: rando.id_local,
                nom_itineraire: rando.nom_itineraire,
                geometry: rando.geometry!,
                difficulte: rando.difficulte,
                duree: rando.duree,
                longueur: rando.longueur,
                denivele_positif: rando.denivele_positif
              })})}
            hoveredTrailId={hoveredTrailId}
            onHover={setHoveredTrailId}
          />
        </div>

        {/* Panel mobile */}
        <div className="fixed md:hidden bottom-0 left-0 right-0 z-40">
          <div className={`bg-white rounded-t-xl shadow-xl transform transition-transform duration-300
                        ${isMobilePanelVisible ? 'translate-y-0' : 'translate-y-[90%]'} h-[80vh]`}>
            <div className="h-8 flex items-center justify-center" onClick={() => setIsMobilePanelVisible(!isMobilePanelVisible)}>
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="h-full overflow-y-auto p-2">
              <ChatInterface 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedHike && (
        <HikeModal
          hike={selectedHike}
          onClose={() => setSelectedHike(null)}
        />
      )}
    </main>
  );
}
