'use client';

import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import MultiPolygon from 'ol/geom/MultiPolygon';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Stroke, Fill } from 'ol/style';
import Overlay from 'ol/Overlay';

interface HikingTrail {
  id_local: string;
  nom_itineraire: string;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  difficulte?: string;
  duree?: number;
  longueur?: number;
  denivele_positif?: number;
}

interface CevennesMapProps {
  randonnees?: HikingTrail[];
  hoveredTrailId?: string | null;
  onHover?: (id: string | null) => void;
}

interface NominatimAreaResult {
  geojson: {
    type: string;
    coordinates: number[][][][];
  };
  boundingbox: string[];
}

export default function CevennesMap({ randonnees = [], hoveredTrailId, onHover }: CevennesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const cevennesLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Overlay | null>(null);

  // Fonction pour charger les limites des Cévennes
  const loadCevennesArea = async () => {
    try {
      const response = await fetch(
        'https://nominatim.openstreetmap.org/search?q=Parc+National+des+Cévennes&format=json&polygon_geojson=1&limit=1'
      );
      const data: NominatimAreaResult[] = await response.json();
      console.log('data', data);

      if (data.length > 0 && data[0].geojson) {
        // Conversion des coordonnées pour MultiPolygon
        const coordinates = data[0].geojson.coordinates.map(polygon => 
          polygon.map(ring => 
            ring.map(coord => fromLonLat([coord[0], coord[1]]))
          )
        );

        const feature = new Feature({
          geometry: new MultiPolygon(coordinates)
        });

        const vectorSource = new VectorSource({
          features: [feature]
        });

        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(74, 222, 128, 0.8)',
              width: 2,
              lineDash: [5, 5]
            }),
            fill: new Fill({
              color: 'rgba(74, 222, 128, 0.05)'
            })
          })
        });

        return vectorLayer;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des limites des Cévennes:', error);
    }
    return null;
  };

  // Initialisation de la carte avec les limites des Cévennes
  useEffect(() => {
    if (!mapRef.current || !tooltipRef.current) return;

    const cevennesCoordinates = fromLonLat([3.5833, 44.1167]);
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: true
    });

    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer],
      view: new View({
        center: cevennesCoordinates,
        zoom: 11,
        minZoom: 8,
        maxZoom: 18
      })
    });

    mapInstanceRef.current = map;

    // Charger et ajouter les limites des Cévennes
    loadCevennesArea().then(layer => {
      console.log('layer', layer);
      if (layer) {
        cevennesLayerRef.current = layer;
        map.addLayer(layer);

        // Ajuster la vue pour montrer l'ensemble des Cévennes
        const extent = layer.getSource()?.getExtent();
        if (extent) {
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 11
          });
        }
      }
    });

    // Ajout du tooltip
    const tooltip = new Overlay({
      element: tooltipRef.current,
      offset: [10, 0],
      positioning: 'bottom-left'
    });
    overlayRef.current = tooltip;
    map.addOverlay(tooltip);

    // Gestion des événements de la souris
    map.on('pointermove', (evt) => {
      const hit = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        // Vérifier que c'est bien une feature de randonnée (avec un name)
        return feature.get('name') ? feature : null;
      });

      if (hit) {
        const id = hit.getId() as string;
        const properties = {
          name: hit.get('name'),
          difficulty: hit.get('difficulty'),
          duration: hit.get('duration'),
          distance: hit.get('distance'),
          elevation: hit.get('elevation'),
        };
        
        // Vérifier que nous avons au moins le nom avant d'afficher le tooltip
        if (properties.name) {
          tooltipRef.current!.innerHTML = `
            <div class="font-medium">${properties.name}</div>
            <div class="flex items-center gap-2 mt-1 text-xs text-gray-600">
              ${properties.difficulty ? 
                `<span class="px-1.5 py-0.5 rounded-full bg-gray-100">${properties.difficulty}</span>` 
                : ''
              }
              ${properties.distance ? 
                `<span>${(properties.distance / 1000).toFixed(1)} km</span>`
                : ''
              }
              ${properties.elevation ? 
                `<span>${properties.elevation}m D+</span>`
                : ''
              }
              ${properties.duration ? 
                `<span>${Math.floor(properties.duration)}h${Math.round((properties.duration % 1) * 60)}min</span>`
                : ''
              }
            </div>
          `;
          tooltip.setPosition(evt.coordinate);
          tooltipRef.current!.style.display = 'block';
          
          onHover?.(id);
        } else {
          tooltipRef.current!.style.display = 'none';
          onHover?.(null);
        }
      } else {
        tooltipRef.current!.style.display = 'none';
        onHover?.(null);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
      }
    };
  }, [onHover]);

  // Gestion des tracés de randonnée
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Création de la source et des features
    const vectorSource = new VectorSource({
      features: randonnees.map(rando => {
        const coordinates = rando.geometry.coordinates.map(coord => 
          fromLonLat([coord[0], coord[1]])
        );
        
        const feature = new Feature({
          geometry: new LineString(coordinates),
          name: rando.nom_itineraire,
          difficulty: rando.difficulte,
          duration: rando.duree,
          distance: rando.longueur,
          elevation: rando.denivele_positif,
        });
        feature.setId(rando.id_local);
        return feature;
      }),
    });

    // Création de la couche vectorielle
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const isHovered = hoveredTrailId === feature.getId();
        return new Style({
          stroke: new Stroke({
            color: isHovered ? '#a52a2a' : '#ff8c00',
            width: isHovered ? 4 : 2,
          })
        });
      }
    });

    // Suppression de l'ancienne couche si elle existe
    if (vectorLayerRef.current) {
      mapInstanceRef.current.removeLayer(vectorLayerRef.current);
    }

    // Ajout de la nouvelle couche
    vectorLayerRef.current = vectorLayer;
    mapInstanceRef.current.addLayer(vectorLayer);

    // Ajustement de la vue si nécessaire
    if (randonnees.length > 0) {
      const extent = vectorSource.getExtent();
      mapInstanceRef.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 14,
        duration: 500 // Animation douce
      });
    }

    return () => {
      if (mapInstanceRef.current && vectorLayerRef.current) {
        mapInstanceRef.current.removeLayer(vectorLayerRef.current);
      }
    };
  }, [randonnees, hoveredTrailId]);

  return (
    <div className="h-full relative">
      <div className="absolute inset-0">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      <div 
        ref={tooltipRef}
        className="map-tooltip absolute hidden bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm 
                 border border-gray-200 pointer-events-none z-10 max-w-xs transform transition-opacity duration-200"
      />
      
      {/* Contrôles améliorés */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 relief-shadow">
        <div className="bg-white rounded-xl overflow-hidden shadow-lg p-1">
          <button 
            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 relief-button"
            onClick={() => {
              if (mapInstanceRef.current) {
                const view = mapInstanceRef.current.getView();
                const zoom = view.getZoom() || 1;
                view.animate({
                  zoom: zoom + 1,
                  duration: 250
                });
              }
            }}
            title="Zoomer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <button 
            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 relief-button mt-1"
            onClick={() => {
              if (mapInstanceRef.current) {
                const view = mapInstanceRef.current.getView();
                const zoom = view.getZoom() || 1;
                view.animate({
                  zoom: zoom - 1,
                  duration: 250
                });
              }
            }}
            title="Dézoomer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button 
            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 relief-button"
            onClick={() => {
              if (cevennesLayerRef.current && mapInstanceRef.current) {
                const extent = cevennesLayerRef.current.getSource()?.getExtent();
                if (extent) {
                  mapInstanceRef.current.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 11,
                    duration: 500
                  });
                }
              }
            }}
            title="Vue d'ensemble"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
        
        {/* Toggle de style de carte */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg mt-2 p-1">
          <button 
            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 relief-button"
            title="Mode satellite"
            onClick={() => {
              // Fonctionnalité pour changer de style de carte
              // à implémenter dans une future version
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Indicateur de chargement */}
      <div className="absolute left-0 right-0 top-0 flex justify-center pointer-events-none z-20">
        <div className="bg-white shadow-lg rounded-b-lg px-4 py-2 text-sm font-medium text-gray-700 transform transition-transform duration-300 opacity-0" 
             id="map-loading-indicator">
          Chargement de la carte...
        </div>
      </div>
      
      {/* Légende de la carte */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs text-sm">
        <h4 className="font-medium text-gray-800 mb-2">Légende</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-orange-500 rounded"></div>
            <span className="text-gray-700">Itinéraires de randonnée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-green-500 rounded"></div>
            <span className="text-gray-700">Limites du parc des Cévennes</span>
          </div>
        </div>
      </div>
    </div>
  );
} 