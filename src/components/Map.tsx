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
  id: string;
  coordinates: [number, number][];
  name: string;
  difficulty?: string;
  duration?: number;
  distance?: number;
  elevation?: number;
}

interface CevennesMapProps {
  hikingPoints?: HikingTrail[];
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

export default function CevennesMap({ hikingPoints = [], hoveredTrailId, onHover }: CevennesMapProps) {
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
      features: hikingPoints.map(trail => {
        const coordinates = trail.coordinates.map(coord => 
          fromLonLat([coord[0], coord[1]])
        );
        
        const feature = new Feature({
          geometry: new LineString(coordinates),
          name: trail.name,
          difficulty: trail.difficulty,
          duration: trail.duration,
          distance: trail.distance,
          elevation: trail.elevation,
        });
        feature.setId(trail.id);
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
    if (hikingPoints.length > 0) {
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
  }, [hikingPoints, hoveredTrailId]);

  return (
    <div className="h-full relative">
      <div className="absolute inset-0">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      <div 
        ref={tooltipRef}
        className="absolute hidden bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm 
                 border border-gray-200 pointer-events-none z-10"
      />
      
      {/* Contrôles supplémentaires */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button 
          className="w-8 h-8 bg-white rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
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
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          className="w-8 h-8 bg-white rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
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
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  );
} 