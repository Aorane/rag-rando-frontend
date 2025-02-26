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
    <main className="h-screen overflow-hidden flex flex-col bg-gray-200">
      {/* Header amélioré avec effet de relief et navigation */}
      <header className="bg-white border-b relative shadow-[0_4px_10px_rgba(0,0,0,0.05),_0_1px_0_rgba(255,255,255,0.8)_inset]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo et titre */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12L8 8L12 12L16 8L20 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16L8 12L12 16L16 12L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Effet de relief sur le logo */}
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ 
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.1)'
                }}></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Cévennes Rando</h1>
                <p className="text-xs text-gray-500 -mt-1">Explorez le parc national</p>
              </div>
            </div>
            
            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors relative group">
                Accueil
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors relative group">
                Explorer
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors relative group">
                À propos du site
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
 
              <button className="ml-4 px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full hover:from-green-600 hover:to-green-700 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.1),_0_1px_0_rgba(255,255,255,0.2)_inset] active:shadow-[0_1px_2px_rgba(0,0,0,0.1),_0_1px_1px_rgba(0,0,0,0.1)_inset] active:translate-y-0.5">
              Contact
              </button>
            </nav>
            
            {/* Menu mobile */}
            <button className="md:hidden p-2 text-gray-700 hover:text-green-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Effet de relief sous le header */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </header>

      {/* Conteneur principal sans espaces entre les éléments */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-gray-200 ">
        
        {/* Panneau de gauche - Chat */}
        <div className="col-span-12 md:col-span-3 lg:col-span-3 bg-white overflow-hidden flex flex-col relative  
                      shadow-[0_15px_25px_rgba(0,0,0,0.1)_inset,_0_-3px_0_rgba(255,255,255,0.8)_inset,_5px_0_15px_-5px_rgba(0,0,0,0.3)]
                      z-30">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 border-b flex items-center">
            <h2 className="text-sm font-medium text-white">Conversation</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isSearching}
            />
          </div>
          {/* Bord droit pour effet de profondeur */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 shadow-[1px_0_3px_rgba(0,0,0,0.1)]"></div>
        </div>
        
        {/* Panneau central - Résultats */}
        <div className="md:block md:col-span-3 lg:col-span-3 bg-white overflow-hidden flex flex-col relative
                      shadow-[0_15px_25px_rgba(0,0,0,0.1)_inset,_0_-3px_0_rgba(255,255,255,0.8)_inset,_5px_0_15px_-5px_rgba(0,0,0,0.3)]
                      z-20">
          <div className="p-2   border-b flex justify-between items-center">
            <h2 className="text-sm font-medium text-black">
              {searchResults ? `Résultats (${searchResults.results.length})` : 'Résultats'}
            </h2>
            {isSearching && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="h-full overflow-y-auto  p-2 custom-scrollbar pb-12">
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
          {/* Bords pour effet de profondeur */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 shadow-[-1px_0_3px_rgba(0,0,0,0.1)]"></div>
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 shadow-[1px_0_3px_rgba(0,0,0,0.1)]"></div>
        </div>
        
        {/* Panneau droit - Carte */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 relative
                      shadow-[0_15px_25px_rgba(0,0,0,0.2)_inset,_0_-3px_0_rgba(255,255,255,0.8)_inset]
                      z-10">
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
          {/* Effet de relief sur les bords */}
          <div className="absolute inset-0 pointer-events-none" style={{ 
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)'
          }}></div>
          {/* Bord gauche pour effet de profondeur */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gray-300 via-gray-200 to-gray-300 shadow-[-1px_0_3px_rgba(0,0,0,0.1)]"></div>
        </div>

        {/* Panneau mobile pour les résultats et le chat */}
        <div className="fixed md:hidden bottom-0 left-0 right-0 z-40">
          <div 
            className={`
              bg-white rounded-t-xl shadow-xl
              transform transition-transform duration-300 ease-in-out
              ${isPanelVisible ? 'translate-y-0' : 'translate-y-[90%]'}
              h-[80vh] flex flex-col
            `}
          >
            {/* Poignée de glissement */}
            <div 
              className="h-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
              onClick={() => setIsPanelVisible(!isPanelVisible)}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Onglets sur mobile */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-sm font-medium relative
                           ${activeTab === 'chat' ? 'text-green-600' : 'text-gray-500'}`}
              >
                Chat
                {activeTab === 'chat' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 py-2 text-sm font-medium relative
                           ${activeTab === 'results' ? 'text-green-600' : 'text-gray-500'}`}
              >
                Résultats
                {activeTab === 'results' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                )}
              </button>
            </div>
            
            {/* Contenu des onglets */}
            <div className="flex-1 relative overflow-hidden">
              <div 
                className={`absolute inset-0 transition-transform duration-300 ease-in-out
                           ${activeTab === 'chat' ? 'translate-x-0' : '-translate-x-full'}`}
              >
                <ChatInterface 
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isLoading={isSearching}
                />
              </div>
              
              <div 
                className={`absolute inset-0 transition-transform duration-300 ease-in-out
                           ${activeTab === 'results' ? 'translate-x-0' : 'translate-x-full'}`}
              >
                <div className="flex-1 overflow-y-auto p-2 h-full custom-scrollbar">
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsPanelVisible(false)}
          />
        )}
      </div>
      
      {selectedHike && (
        <HikeModal
          hike={selectedHike}
          onClose={() => setSelectedHike(null)}
        />
      )}

      {/* Footer amélioré avec effet de relief et sections */}
      <footer className="bg-white border-t relative shadow-[0_-4px_10px_rgba(0,0,0,0.05),_0_-1px_0_rgba(255,255,255,0.8)_inset] z-0">
        <div className="container mx-auto px-4 pb-4">
          <div className="  pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              © 2024 Cévennes Rando. Tous droits réservés.
            </p>
            <div className="flex gap-4 mt-3 md:mt-0">
              <a href="#" className="text-xs text-gray-500 hover:text-green-600 transition-colors">Confidentialité</a>
              <a href="#" className="text-xs text-gray-500 hover:text-green-600 transition-colors">Conditions d'utilisation</a>
              <a href="#" className="text-xs text-gray-500 hover:text-green-600 transition-colors">Mentions légales</a>
            </div>
          </div>
    </div>
      </footer>
    </main>
  );
}
