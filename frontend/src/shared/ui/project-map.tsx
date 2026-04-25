"use client"

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Project, ProjectStatuses } from '../lib/mock-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Square, Trash2 } from 'lucide-react';

interface ProjectMapProps {
  projects?: Project[];
  onProjectClick?: (project: Project) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  onPolygonSelect?: (polygon: number[][] | null) => void;
  mode?: 'explorer' | 'picker';
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  className?: string;
  enablePolygonDraw?: boolean;
  initialPolygon?: number[][];
}

export const ProjectMap: React.FC<ProjectMapProps> = ({
  projects = [],
  onProjectClick,
  onLocationSelect,
  onPolygonSelect,
  mode = 'explorer',
  initialCenter = { lat: 56.8389, lng: 60.6057 }, // Екатеринбург
  initialZoom = 12,
  className = "h-[400px] w-full rounded-xl overflow-hidden shadow-inner",
  enablePolygonDraw = false,
  initialPolygon = [],
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const normalizePolygon = (coords: number[][]): number[][] => {
    if (coords.length < 2) return coords;
    const first = coords[0];
    const last = coords[coords.length - 1];
    const isClosed = first[0] === last[0] && first[1] === last[1];
    return isClosed ? coords.slice(0, -1) : coords;
  };

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
            maxzoom: 19,
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
      maxZoom: 19,
      attributionControl: false,
    });

    map.current = mapInstance;

    if (mode === 'picker') {
      if (enablePolygonDraw) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {},
          styles: [
            {
              'id': 'gl-draw-polygon-fill-inactive',
              'type': 'fill',
              'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'paint': {
                'fill-color': '#3b82f6',
                'fill-outline-color': '#3b82f6',
                'fill-opacity': 0.2
              }
            },
            {
              'id': 'gl-draw-polygon-fill-active',
              'type': 'fill',
              'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
              'paint': {
                'fill-color': '#3b82f6',
                'fill-outline-color': '#3b82f6',
                'fill-opacity': 0.4
              }
            },
            {
              'id': 'gl-draw-polygon-stroke-inactive',
              'type': 'line',
              'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                'line-color': '#2563eb',
                'line-width': 2
              }
            },
            {
              'id': 'gl-draw-polygon-stroke-active',
              'type': 'line',
              'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                'line-color': '#2563eb',
                'line-dasharray': [0.2, 2],
                'line-width': 2
              }
            },
            {
              'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
              'paint': {
                'circle-radius': 6,
                'circle-color': '#fff'
              }
            },
            {
              'id': 'gl-draw-polygon-and-line-vertex-inactive',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
              'paint': {
                'circle-radius': 4,
                'circle-color': '#2563eb'
              }
            },
            {
              'id': 'gl-draw-polygon-and-line-vertex-stroke-active',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static'], ['==', 'active', 'true']],
              'paint': {
                'circle-radius': 8,
                'circle-color': '#fff'
              }
            },
            {
              'id': 'gl-draw-polygon-and-line-vertex-active',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static'], ['==', 'active', 'true']],
              'paint': {
                'circle-radius': 6,
                'circle-color': '#2563eb'
              }
            },
            {
              'id': 'gl-draw-polygon-midpoint',
              'type': 'circle',
              'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
              'paint': {
                'circle-radius': 4,
                'circle-color': '#3b82f6'
              }
            }
          ]
        });

        drawRef.current = draw;
        mapInstance.addControl(draw as unknown as maplibregl.IControl, 'top-right');

        if (initialPolygon.length >= 3) {
          const closed = [...initialPolygon];
          const first = closed[0];
          const last = closed[closed.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            closed.push(first);
          }
          draw.add({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [closed],
            },
          });
        }

        const syncPolygon = () => {
          const drawData = draw.getAll();
          const polygonFeature = drawData.features.find((f) => f.geometry.type === 'Polygon');
          if (!polygonFeature) {
            onPolygonSelect?.(null);
            return;
          }
          const ring = (polygonFeature.geometry as GeoJSON.Polygon).coordinates[0] || [];
          onPolygonSelect?.(normalizePolygon(ring as number[][]));
        };

        const enforceSinglePolygon = () => {
          const all = draw.getAll().features.filter((f) => f.geometry.type === 'Polygon');
          if (all.length > 1) {
            all.slice(0, -1).forEach((f) => draw.delete(f.id as string));
          }
          syncPolygon();
        };

        mapInstance.on('draw.create', enforceSinglePolygon);
        mapInstance.on('draw.update', syncPolygon);
        mapInstance.on('draw.delete', () => onPolygonSelect?.(null));
      }

      mapInstance.on('click', (e) => {
        // Если включен режим рисования полигонов, мы запрещаем ручную установку точки кликом.
        // Сервер сам высчитает центр полигона при сохранении заявки.
        if (enablePolygonDraw) {
          return;
        }

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
      if (drawRef.current && mapInstance.hasControl(drawRef.current as unknown as maplibregl.IControl)) {
        mapInstance.removeControl(drawRef.current as unknown as maplibregl.IControl);
      }
      drawRef.current = null;
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
      
      if (mode === 'picker' && !enablePolygonDraw) {
        if (marker.current) {
          marker.current.setLngLat([initialCenter.lng, initialCenter.lat]);
        } else if (map.current) {
          marker.current = new maplibregl.Marker({ color: '#ef4444' })
            .setLngLat([initialCenter.lng, initialCenter.lat])
            .addTo(map.current);
        }
      }
    }
  }, [initialCenter, initialZoom, mode, enablePolygonDraw]);

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
        (mapInstance.getSource('projects') as maplibregl.GeoJSONSource)
          .getClusterExpansionZoom(clusterId)
          .then((zoom: number) => {
            mapInstance.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom,
            });
          });
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
                <span class="text-sm font-black text-primary">${(props.budget || 0).toLocaleString()} ₽</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">${props.status}</span>
              </div>
              <button 
                class="project-details-btn w-full mt-2 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-primary transition-colors cursor-pointer"
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
    <div className="flex flex-col gap-3 w-full h-full">
      {enablePolygonDraw && mode === 'picker' && (
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => drawRef.current?.changeMode('draw_polygon')}
            className="flex-1 border-border text-primary hover:bg-primary/10"
          >
            <Square className="w-4 h-4 mr-2" />
            Нарисовать полигон
          </Button>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (drawRef.current) {
                drawRef.current.deleteAll();
                onPolygonSelect?.(null);
              }
            }}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Очистить
          </Button>
        </div>
      )}
      <div className="relative w-full h-full min-h-[300px] flex-1">
        <div ref={mapContainer} className={className} />
        {mode === 'picker' && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-2 rounded shadow-sm text-xs font-medium z-10 text-slate-900 pointer-events-none">
            Кликните по карте для установки точки
          </div>
        )}
      </div>
    </div>
  );
};
