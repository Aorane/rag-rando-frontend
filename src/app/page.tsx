'use client';

import { useState, useRef, useEffect } from 'react';
// import Image from 'next/image';
import CevennesMap from '@/components/Map';
import HikeCard from '@/components/HikeCard';
import HikeModal from '@/components/HikeModal';
import { searchHikes } from '@/services/api';
import type { SearchResponse, HikeResult } from '@/types/search';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [selectedHike, setSelectedHike] = useState<HikeResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling,] = useState(false);
  const [activeTab, setActiveTab] = useState("synthese");
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const results = await searchHikes(searchQuery);
      setSearchResults(results);
      console.log('============>', results)
    } catch (err) {
      console.error("Une erreur s&apos;est produite lors de la recherche. Veuillez réessayer.", err);
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
    <main className="min-h-screen bg-gray-50  ">
      {/* Header Navigation - Design amélioré et plus impactant */}
      <header className="absolute top-0 left-0 right-0 z-50">
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
                        className="group-hover:text-green-700 transition-colors" />
                      <path d="M4 16L8 12L12 16L16 12L20 16"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="group-hover:text-green-500 transition-colors" />
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="hidden sm:inline">S&apos;inscrire</span>
                </button>

                {/* Menu mobile */}
                <button className="md:hidden p-2 text-gray-600 hover:text-green-700 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content avec Hero amélioré */}
      <div className="pt-20">
        <section className="relative h-[100vh] flex items-center justify-center overflow-hidden">
          {/* Overlay d'image avec parallax */}
          <div className="absolute inset-0">
            <picture>
              <img
                src="/mountains3.jpg"
                alt="Paysage des Cévennes"
                className="object-cover transform scale-105 motion-safe:animate-subtle-zoom"
              />
            </picture>
            {/* <Image
              src="/mountains3.jpg"
              alt="Paysage des Cévennes"
              fill
              className="object-cover transform scale-105 motion-safe:animate-subtle-zoom"
              priority
            /> */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
          </div>

          {/* Contenu Hero */}
          <div className="relative z-10 max-w-4xl w-full mx-4 space-y-8 transform motion-safe:animate-fade-in">
            <div className="text-center text-white space-y-4">
              <h2 className="text-5xl font-bold text-shadow-lg">
                La randonnée en langage naturel
              </h2>
              <p className="text-xl text-shadow max-w-2xl mx-auto">
                Décrivez votre randonnée idéale comme vous le feriez à un ami. Notre IA comprend et trouve les meilleurs parcours.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20
                          transform hover:scale-[1.02] transition-all duration-300">
              {/* Exemples de requêtes */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  "Randonnée de 3h max avec des cascades",
                  "Circuit panoramique de 4h max",
                  "Balade familiale près du Mont Aigoual"
                ].map((exemple, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(exemple)}
                    className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-full 
                             hover:bg-green-100 transition-colors whitespace-nowrap"
                  >
                    {exemple}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: Je cherche une randonnée facile de 2h avec de beaux points de vue..."
                  className="w-full px-6 py-4 pr-14 rounded-xl border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           text-gray-700 placeholder-gray-400 shadow-inner bg-white"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-600 text-white 
                           rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400
                           disabled:cursor-not-allowed group"
                >
                  {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 transform group-hover:rotate-6 transition-transform"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Suggestions d'utilisation */}
              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium mb-2">Essayez d&apos;être précis :</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    &quot;Randonnée de 3h max avec des ruisseaux&quot;
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    &quot;Circuit ombragé pour l&apos;été avec pique&quot;nique&quot;
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section principale avec Map et Résultats */}
        <section className="min-h-screen relative">
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
                h-[92vh] md:h-full flex flex-col
                rounded-t-2xl md:rounded-none  md:shadow-none 
              `}
            >
              {/* Poignée de glissement sur mobile */}
              <div
                className="h-10 flex flex-col items-center justify-center md:hidden bg-white rounded-t-2xl cursor-grab active:cursor-grabbing touch-handle "
                onTouchStart={() => setIsPanelVisible(!isPanelVisible)}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>

              {/* Contenu du panneau */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white shadow-[rgba(0,0,15,0.5)_5px_5px_4px_0px] ">
                {/* En-tête avec logo et titre */}
                {/* <div className="p-4 border-b border-gray-200 bg-white">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Résultats de la recherche</h2>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Rechercher une randonnée..."
                      className="w-full px-4 py-3 pl-10 pr-4 rounded-lg border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                               transition-all duration-200 bg-gray-50"
                    />
                    <button
                      onClick={handleSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-600 text-white 
                               rounded-md hover:bg-green-700 transition-colors"
                    >
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                    <button className="inline-flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 
                                     rounded-full text-sm whitespace-nowrap transition-colors duration-200">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Distance
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 
                                     rounded-full text-sm whitespace-nowrap transition-colors duration-200">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Difficulté
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 
                                     rounded-full text-sm whitespace-nowrap transition-colors duration-200">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Durée
                    </button>
                  </div>
                </div> */}

                {/* Onglets */}
                <div className="flex border-b border-gray-200 bg-white">
                  <button
                    onClick={() => setActiveTab('synthese')}
                    className={`flex-1 py-3 text-sm font-medium relative transition-colors duration-200
                               ${activeTab === 'synthese'
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Synthèse
                    {activeTab === 'synthese' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('liste')}
                    className={`flex-1 py-3 text-sm font-medium relative transition-colors duration-200
                               ${activeTab === 'liste'
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Liste
                    {activeTab === 'liste' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                    )}
                  </button>
                </div>

                {/* Contenu des onglets */}
                <div className="flex-1 overflow-hidden relative bg-gray-50">
                  <div className={`absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto
                                  ${activeTab === 'synthese' ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Contenu Synthèse */}
                    {searchResults?.llm_response ? (
                      <div className="p-4 space-y-6 ">
                        <div className="space-y-3 ">
                          <h4 className="text-lg font-medium text-gray-800">
                            {searchResults.llm_response.summary.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {searchResults.llm_response.summary.interpretation}
                          </p>
                          <p className="text-sm text-gray-600">ffffffffffff
                            {searchResults.llm_response.summary.comparaison}
                          </p>
                          <div className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                            {searchResults.llm_response.summary.results_count}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-700">Points clés</h5>
                          <ul className="space-y-2">
                            {searchResults.llm_response.analysis.main_points.map((point, index) => (
                              <li key={index} className="flex gap-2 text-sm text-gray-600">
                                <span className="text-green-600">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-700">Suggestions</h5>
                          <ul className="space-y-2">
                            {searchResults.llm_response.analysis.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex gap-2 text-sm text-gray-600 items-start">
                                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700">Randonnées suggérées</h5>
                          <div className="space-y-3">
                            {searchResults.llm_response.highlights.map((highlight, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                                onMouseEnter={() => setHoveredTrailId(highlight.id)}
                                onMouseLeave={() => setHoveredTrailId(null)}
                              >
                                <p className="text-sm text-gray-600">{highlight.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-gray-500 italic">Aucune synthèse disponible</div>
                    )}
                  </div>

                  <div className={`absolute inset-0 transition-transform duration-300 ease-in-out
                                  ${activeTab === 'liste' ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Contenu Liste */}
                    <div className="overflow-y-auto h-full p-2">
                      {searchResults?.results.map((hike) => (
                        <HikeCard
                          key={hike.id_local}
                          hike={hike}
                          onHover={(id) => setHoveredTrailId(id)}
                          onSelect={(h) => setSelectedHike(h)}
                          isHighlighted={hoveredTrailId === hike.id_local}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay sombre quand le panneau est ouvert sur mobile */}
            {isPanelVisible && (
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
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
        <footer className="bg-gray-800 text-gray-300 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Logo et copyright */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="w-10 h-8 text-green-600 transform group-hover:scale-110 transition-transform duration-300"
                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12L8 8L12 12L16 8L20 12"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="group-hover:text-green-700 transition-colors" />
                    <path d="M4 16L8 12L12 16L16 12L20 16"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="group-hover:text-green-500 transition-colors" />
                  </svg>
                  <div className="absolute -inset-1 bg-green-100 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                </div>
                <span className="text-sm">
                  &copy; {new Date().getFullYear()} Cévennes Rando
                </span>
              </div>

              {/* Liens essentiels */}
              <div className="flex items-center gap-6 text-sm">
                <a href="/mentions-legales" className="text-gray-400 hover:text-white transition-colors">
                  Mentions légales
                </a>
                <a href="/confidentialite" className="text-gray-400 hover:text-white transition-colors">
                  Confidentialité
                </a>
                <a href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>

  );
}
