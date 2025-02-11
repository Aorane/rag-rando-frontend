'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import CevennesMap from '@/components/Map';
import HikeCard from '@/components/HikeCard';
import HikeModal from '@/components/HikeModal';
import { searchHikes } from '@/services/api';
import type { SearchResponse, HikeResult } from '@/types/search';



// Fonction utilitaire pour formater la durée
const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}min`;
};



export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [selectedHike, setSelectedHike] = useState<HikeResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchHikes(searchQuery);
      setSearchResults(results);
      console.log('============>', results)
    } catch (err) {
      setError("Une erreur s'est produite lors de la recherche. Veuillez réessayer.");
    } finally {
      setIsSearching(false);
    }
  };

  const popularAreas = [
    'Mont Aigoual',
    'Mont Lozère',
    'Vallée du Tarn',
    'Gorges de la Jonte',
    'Vallée Française',
    'Corniche des Cévennes'
  ];

  const difficultyLevels = [
    { label: 'Facile', color: 'bg-green-100 text-green-800' },
    { label: 'Modéré', color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Difficile', color: 'bg-red-100 text-red-800' }
  ];

  // Fonction pour faire défiler jusqu'à la randonnée
  const scrollToHike = (hikeId: string) => {
    if (!resultsRef.current || isUserScrolling) return;

    const hikeElement = resultsRef.current.querySelector(`[data-hike-id="${hikeId}"]`);
    if (hikeElement) {
      // Calculer la position de défilement dans le conteneur
      const container = resultsRef.current;
      const elementTop = (hikeElement as HTMLElement).offsetTop;
      const containerScrollTop = container.scrollTop;
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
  }, [hoveredTrailId, isUserScrolling]);

  // Gestionnaire de scroll utilisateur
  const handleScroll = () => {
    setIsUserScrolling(true);
    
    // Réinitialiser isUserScrolling après un délai
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000); // Attendre 1 seconde après le dernier scroll
  };

  // Fonction pour détecter si le texte survolé contient une randonnée
  const handleLLMTextHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const text = (event.target as HTMLElement).textContent?.toLowerCase();
    if (!text || !searchResults?.results) return;

    // Chercher quelle randonnée est mentionnée dans le texte survolé
    const matchingHike = searchResults.results.find(hike => 
      text.includes(hike.nom_itineraire.toLowerCase())
    );

    if (matchingHike) {
      setHoveredTrailId(matchingHike.id_local);
    } else {
      setHoveredTrailId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header Navigation - Design amélioré et plus impactant */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Barre supérieure avec gradient et effet glassmorphism */}
        <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
        
        <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Barre principale */}
            <div className="px-4 h-20 flex items-center justify-between">
              {/* Logo et Nom */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative">
                    <svg className="w-10 h-10 text-green-600 transform group-hover:scale-110 transition-transform duration-300" 
                         viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 12L8 8L12 12L16 8L20 12" 
                            stroke="currentColor" strokeWidth="2.5" 
                            strokeLinecap="round" strokeLinejoin="round"
                            className="group-hover:text-green-700 transition-colors"/>
                      <path d="M4 16L8 12L12 16L16 12L20 16" 
                            stroke="currentColor" strokeWidth="2.5" 
                            strokeLinecap="round" strokeLinejoin="round"
                            className="group-hover:text-green-500 transition-colors"/>
                    </svg>
                    <div className="absolute -inset-1 bg-green-100 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent
                                  group-hover:from-green-800 group-hover:to-green-600 transition-all duration-300">
                      Cévennes Rando
                    </h1>
                    <span className="text-xs text-gray-500 hidden sm:block">Explorez les sentiers</span>
                  </div>
                </div>

                {/* Navigation principale */}
                <div className="hidden md:flex space-x-1">
                  {['Explorer', 'Secteurs', 'Carte IGN'].map((item) => (
                    <button key={item}
                      className="px-4 py-2 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50
                                transition-all duration-200 flex items-center gap-2 relative group">
                      <span className="absolute inset-0 bg-green-100 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></span>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions utilisateur */}
              <div className="flex items-center space-x-4">
                {/* Bouton Connexion */}
                <button className="px-4 py-2 text-gray-600 hover:text-green-700 transition-colors duration-200
                                 flex items-center gap-2 rounded-lg hover:bg-green-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span className="hidden sm:inline">Connexion</span>
                </button>

                {/* Bouton Inscription */}
                <button className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg
                                 hover:from-green-700 hover:to-green-600 transition-all duration-300
                                 shadow-md hover:shadow-lg transform hover:scale-105
                                 flex items-center gap-2 relative group">
                  <span className="absolute inset-0 bg-white rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  <span className="hidden sm:inline">S'inscrire</span>
                </button>

                {/* Menu mobile */}
                <button className="md:hidden p-2 text-gray-600 hover:text-green-700 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content avec Hero amélioré */}
      <div className="pt-20">
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Overlay d'image avec parallax */}
          <div className="absolute inset-0">
            <Image
              src="/mountains3.jpg"
              alt="Paysage des Cévennes"
              fill
              className="object-cover transform scale-105 motion-safe:animate-subtle-zoom"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
          </div>

          {/* Contenu Hero */}
          <div className="relative z-10 max-w-4xl w-full mx-4 space-y-8 transform motion-safe:animate-fade-in">
            <div className="text-center text-white space-y-4">
              <h2 className="text-5xl font-bold text-shadow-lg">
                Explorez les Cévennes
              </h2>
              <p className="text-xl text-shadow">
                Des causses aux vallées cévenoles, découvrez plus de 1000 randonnées dans le Parc national
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20
                          transform hover:scale-[1.02] transition-all duration-300">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: Randonnée facile vers le Mont Aigoual, Circuit des cascades..."
                  className="w-full px-6 py-4 pr-14 rounded-xl border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           text-lg shadow-inner bg-white/90 backdrop-blur-sm transition-all duration-200
                           hover:shadow-lg"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                           p-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg
                           hover:from-green-700 hover:to-green-600 transition-all duration-200
                           disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed
                           shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section Résultats & Carte */}
        <section className="max-w-[1920px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Colonne 1: Réponse LLM */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-lg shadow-lg sticky top-24">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">Suggestions de l'IA</h3>
                </div>
                <div className="p-4">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}
                  {searchResults?.llm_response ? (
                    <div 
                      className="prose prose-sm max-w-none prose-green"
                      onMouseMove={handleLLMTextHover}
                      onMouseLeave={() => setHoveredTrailId(null)}
                    >
                      {/* Diviser le texte en paragraphes et ajouter des event handlers */}
                      {searchResults.llm_response.split('\n').map((paragraph, index) => (
                        <p 
                          key={index}
                          className="hover:bg-green-50 transition-colors rounded cursor-pointer"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      Lancez une recherche pour obtenir des suggestions personnalisées
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne 2: Liste des randonnées */}
            <div className="xl:col-span-4">
              <div className="bg-white rounded-lg shadow-lg sticky top-24 h-[calc(100vh-8rem)]">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Résultats</h3>
                  <span className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full">
                    {searchResults?.results.length 
                      ? `${searchResults.results.length} randonnées`
                      : 'Aucun résultat'}
                  </span>
                </div>
                <div 
                  ref={resultsRef}
                  className="overflow-y-auto scroll-smooth h-[calc(100%-4rem)]"
                  onWheel={() => setIsUserScrolling(true)}
                  onTouchMove={() => setIsUserScrolling(true)}
                  onScroll={handleScroll}
                >
                  {searchResults?.results.map((hike) => (
                    <div key={hike.id_local} data-hike-id={hike.id_local}>
                      <HikeCard 
                        hike={hike}
                        onHover={(id) => setHoveredTrailId(id)}
                        onSelect={(h) => setSelectedHike(h)}
                        isHighlighted={hoveredTrailId === hike.id_local}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne 3: Carte */}
            <div className="xl:col-span-5">
              <div className="bg-white rounded-lg shadow-lg sticky top-24">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">Carte interactive</h3>
                </div>
                <div className="p-4">
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
            </div>
          </div>
        </section>

        {selectedHike && (
          <HikeModal 
            hike={selectedHike} 
            onClose={() => setSelectedHike(null)} 
          />
        )}

        {/* Section Secteurs Populaires */}
        <section className="max-w-8xl mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Découvrez nos secteurs populaires</h3>
            <p className="text-gray-600">
              Explorez les zones les plus prisées pour vos randonnées dans les Cévennes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {popularAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105">
                <div 
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url('/placeholder.jpg')` }}  // Remplacer par une image réelle si disponible
                >
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-800">{area}</h4>
                  <p className="text-sm text-gray-500">Découvrez le charme de {area}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 py-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold">Cévennes Rando</h4>
              <p className="text-sm">Explorez les sentiers, vivez l'aventure.</p>
            </div>
            <div className="flex space-x-4">
              <a href="/a-propos" className="hover:text-white transition-colors">À propos</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</a>
            </div>
          </div>
          <div className="mt-4 text-center text-xs">
            &copy; {new Date().getFullYear()} Cévennes Rando. Tous droits réservés.
          </div>
        </footer>
    </div>
    </main>
  );
}
