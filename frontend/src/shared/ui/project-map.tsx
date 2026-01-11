"use client"

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Project, ProjectStatuses } from '../lib/mock-data';
import { Card } from '@/components/ui/card';

interface ProjectMapProps {
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  mode?: 'explorer' | 'picker';
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  className?: string;
}

export const ProjectMap: React.FC<ProjectMapProps> = ({
  projects = [],
  onProjectClick,
  onLocationSelect,
  mode = 'explorer',
  initialCenter = { lat: 56.8389, lng: 60.6057 }, // Екатеринбург
  initialZoom = 12,
  className = "h-[400px] w-full rounded-xl overflow-hidden shadow-inner"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  // Инициализация карты
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      attributionControl: false,
    });

    map.current = mapInstance;

    if (mode === 'picker') {
      mapInstance.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        } else {
          marker.current = new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
        }

        if (onLocationSelect) {
          onLocationSelect({
            lat,
            lng,
            address: `Координаты: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
          });
        }
      });
    }

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Управление центром карты (flyTo) - только если центр изменился извне (например, поиск)
  const prevCenterRef = useRef(initialCenter);
  useEffect(() => {
    if (map.current && initialCenter && 
       (initialCenter.lat !== prevCenterRef.current?.lat || initialCenter.lng !== prevCenterRef.current?.lng)) {
      map.current.flyTo({
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        essential: true
      });
      prevCenterRef.current = initialCenter;
      
      if (mode === 'picker') {
        if (marker.current) {
          marker.current.setLngLat([initialCenter.lng, initialCenter.lat]);
        } else if (map.current) {
          marker.current = new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([initialCenter.lng, initialCenter.lat])
            .addTo(map.current);
        }
      }
    }
  }, [initialCenter, initialZoom, mode]);

  // Управление слоями и данными (explorer mode)
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mode !== 'explorer') return;

    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('project-details-btn')) {
        const projectId = target.getAttribute('data-project-id');
        const project = projects.find(p => p.id === projectId);
        if (project && onProjectClick) {
          onProjectClick(project);
        }
      }
    };

    const container = mapContainer.current;
    container?.addEventListener('click', handlePopupClick);

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: projects.map(project => {
        // Расчет бюджета, если он 0 в основном поле
        let displayBudget = project.budget || 0;
        if (displayBudget === 0 && project.resources && project.resources.length > 0) {
          displayBudget = project.resources.reduce((sum, r) => {
            const price = r.basePrice || r.estimatedCost || 0;
            const qty = r.quantity || 0;
            return sum + (price * qty);
          }, 0);
        }

        return {
          type: 'Feature',
          properties: {
            id: project.id,
            title: project.title,
            location: project.location,
            budget: displayBudget,
            status: project.status,
          },
          geometry: {
            type: 'Point',
            coordinates: [project.coordinates.lng, project.coordinates.lat]
          }
        };
      })
    };

    const setupLayers = () => {
      if (!mapInstance.getStyle()) return;

      if (mapInstance.getSource('projects')) {
        (mapInstance.getSource('projects') as maplibregl.GeoJSONSource).setData(geojson);
        return;
      }

      mapInstance.addSource('projects', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'projects',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      mapInstance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'projects',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12
        }
      });

      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'projects',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'status'],
            'ACTIVE', '#3b82f6',
            'SUCCESS', '#10b981',
            '#94a3b8'
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      mapInstance.on('click', 'clusters', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        (mapInstance.getSource('projects') as maplibregl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            mapInstance.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: zoom!
            });
          }
        );
      });

      mapInstance.on('click', 'unclustered-point', (e) => {
        const coordinates = (e.features![0].geometry as any).coordinates.slice();
        const props = e.features![0].properties;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<div class="p-3 min-w-[200px] space-y-2 text-slate-900">
              <h3 class="font-bold text-base leading-tight">${props.title}</h3>
              <p class="text-xs text-slate-500">${props.location}</p>
              <div class="flex items-center justify-between pt-1">
                <span class="text-sm font-black text-blue-600">${(props.budget || 0).toLocaleString()} ₽</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">${props.status}</span>
              </div>
              <button 
                class="project-details-btn w-full mt-2 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                data-project-id="${props.id}"
              >
                Подробнее
              </button>
            </div>`
          )
          .addTo(mapInstance);
      });

      const setPointerCursor = () => { mapInstance.getCanvas().style.cursor = 'pointer'; };
      const resetCursor = () => { mapInstance.getCanvas().style.cursor = ''; };

      mapInstance.on('mouseenter', 'clusters', setPointerCursor);
      mapInstance.on('mouseleave', 'clusters', resetCursor);
      mapInstance.on('mouseenter', 'unclustered-point', setPointerCursor);
      mapInstance.on('mouseleave', 'unclustered-point', resetCursor);
    };

    if (mapInstance.loaded()) {
      setupLayers();
    } else {
      mapInstance.once('load', setupLayers);
    }

    return () => {
      container?.removeEventListener('click', handlePopupClick);
      if (mapInstance && mapInstance.getStyle()) {
        const layers = ['clusters', 'cluster-count', 'unclustered-point'];
        layers.forEach(layer => {
          if (mapInstance.getLayer(layer)) mapInstance.removeLayer(layer);
        });
        if (mapInstance.getSource('projects')) mapInstance.removeSource('projects');
      }
    };
  }, [projects, mode, onProjectClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {mode === 'picker' && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-2 rounded shadow-sm text-xs font-medium z-10 text-slate-900">
          Кликните по карте для выбора места
        </div>
      )}
    </div>
  );
};
