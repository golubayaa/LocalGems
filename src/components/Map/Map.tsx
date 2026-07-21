// src/components/Map/Map.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { YMaps, Map as YandexMap, Placemark } from "@pbe/react-yandex-maps";
import { type Place } from "../../data/mockPlaces";
import { useStore } from "../../store/useStore";
import PlaceDetailsModal from "./PlaceDetailsModal";
import { useMediaQuery } from "../../hooks/useMediaQuery";

declare global {
  interface Window {
    isSelectingCoords?: boolean;
    setSelectedCoords?: (lat: number, lng: number) => void;
    openAddPlaceModal?: () => void;
  }
}

interface YandexMapEvent {
  get: (key: string) => unknown;
}

const createIcon = (color: string) => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="3" />
    </svg>
  `;
};

const categoryColorMap: Record<string, string> = {
  "Кафе": "#2A7DE1",
  "Рестораны": "#FF6B35",
  "Архитектура": "#AF52DE",
  "Парки": "#34C759",
  "Музеи": "#FF3B30",
  "Стрит-арт": "#FF2D92",
  "Бары": "#FF9500",
  "Коворкинги": "#8E8E93",
  "Магазины": "#5AC8FA",
  "Ярмарки": "#A2845E",
  "Нишевые места": "#4A9E9E",
};

interface MapProps {
  className?: string;
  places: Place[];
  center?: [number, number] | null;
}

const Map = ({ className = "", places, center }: MapProps) => {
  const isMobile = !useMediaQuery("(min-width: 768px)");

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToRoute, removeFromRoute, route } = useStore();

  const [tempMarkerCoords, setTempMarkerCoords] = useState<[number, number] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const hideTimerRef = useRef<number | null>(null);
  const mapInstanceRef = useRef<{ setCenter?: (center: [number, number]) => void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultCenter: [number, number] = [56.8389, 60.6057];
  const mapCenter = center || defaultCenter;

  const handleMapInstance = useCallback((instance: { setCenter?: (center: [number, number]) => void } | null) => {
  if (instance) {
    mapInstanceRef.current = instance;
  }
  }, []);

  useEffect(() => {
    if (!center) return;
    
    const applyCenter = () => {
      const map = mapInstanceRef.current;
      if (!map) {
        setTimeout(applyCenter, 500);
        return;
      }
      
      if (typeof map.setCenter === "function") {
        map.setCenter(center);
      }
    };
    
    applyCenter();
  }, [center]);

  useEffect(() => {
    const interval = setInterval(() => {
      const flag = window.isSelectingCoords || false;
      if (flag !== isSelecting) {
        setIsSelecting(flag);
        if (!flag) {
          setTempMarkerCoords(null);
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isSelecting]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
    setHoveredPlace(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPlace(null);
  }, []);

  const showPopup = useCallback((place: Place, event: YandexMapEvent) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    let x = 0, y = 0;
    try {
      const pp = event.get('pagePixels') as [number, number] | null;
      if (pp && Array.isArray(pp) && pp.length === 2) {
        x = pp[0];
        y = pp[1];
      }
    } catch {
      try {
        const e1 = (event as unknown as { originalEvent?: { _cache?: { pagePixels?: [number, number] } } })
          .originalEvent;
        if (e1 && e1._cache && e1._cache.pagePixels) {
          const pp = e1._cache.pagePixels;
          if (Array.isArray(pp) && pp.length === 2) {
            x = pp[0];
            y = pp[1];
          }
        }
      } catch {
        // игнорируем
      }
    }

    if (x > 0 || y > 0) {
      setHoveredPlace(place);
      setPopupPosition({ x, y });
    }
  }, []);

  const scheduleHidePopup = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setHoveredPlace(null);
      setPopupPosition(null);
      hideTimerRef.current = null;
    }, 150);
  }, []);

  const handleMouseEnter = useCallback((place: Place, event: YandexMapEvent) => {
    showPopup(place, event);
  }, [showPopup]);

  const handleMouseLeave = useCallback(() => {
    scheduleHidePopup();
  }, [scheduleHidePopup]);

  const handlePopupMouseEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    scheduleHidePopup();
  }, [scheduleHidePopup]);

  const handleMapClick = useCallback((e: YandexMapEvent) => {
    if (isSelecting) {
      const coords = e.get('coords') as [number, number] | null;
      if (coords) {
        const [lat, lng] = coords;
        setTempMarkerCoords([lat, lng]);
      }
    }
  }, [isSelecting]);

  const handleConfirmCoords = useCallback(() => {
    if (tempMarkerCoords && window.setSelectedCoords) {
      const [lat, lng] = tempMarkerCoords;
      window.setSelectedCoords(lat, lng);
      window.isSelectingCoords = false;
      setTempMarkerCoords(null);
      setIsSelecting(false);
      if (window.openAddPlaceModal) {
        window.openAddPlaceModal();
      }
    }
  }, [tempMarkerCoords]);

  const handleToggleRoute = useCallback((place: Place) => {
    const isInRoute = route.some((p) => p.id === place.id);
    if (isInRoute) {
      removeFromRoute(place.id);
    } else {
      addToRoute(place);
    }
  }, [route, addToRoute, removeFromRoute]);

  const markers = useMemo(() => {
    return places.map((place, index) => {
      const color = categoryColorMap[place.category] || "#2A7DE1";
      const iconSVG = createIcon(color);
      const markerKey = `${place.guid ?? place.id ?? "place"}-${index}`;

      return (
        <Placemark
          key={markerKey}
          geometry={[place.lat, place.lng]}
          onClick={() => handlePlaceClick(place)}
          onMouseEnter={(e: YandexMapEvent) => handleMouseEnter(place, e)}
          onMouseLeave={handleMouseLeave}
          options={{
            iconLayout: "default#image",
            iconImageHref: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSVG)}`,
            iconImageSize: [30, 30],
            iconImageOffset: [-15, -15],
          }}
        />
      );
    });
  }, [places, handlePlaceClick, handleMouseEnter, handleMouseLeave]);

  const selectingMarker = useMemo(() => {
    if (isSelecting && tempMarkerCoords) {
      return (
        <Placemark
          geometry={tempMarkerCoords}
          options={{
            iconLayout: "default#image",
            iconImageHref: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="25" viewBox="0 0 36 50">' +
              '<path d="M18 0C8.06 0 0 8.06 0 18c0 10 18 32 18 32s18-22 18-32C36 8.06 27.94 0 18 0z" fill="#FF3B30" stroke="white" stroke-width="2"/>' +
              '<circle cx="18" cy="18" r="6" fill="white"/>' +
              '</svg>'
            )}`,
            iconImageSize: [18, 25],
            iconImageOffset: [-9, -25],
            draggable: true,
          }}
          onDragEnd={(e: YandexMapEvent) => {
            const target = e.get('target') as { geometry: { getCoordinates: () => [number, number] } };
            if (target) {
              const coords = target.geometry.getCoordinates();
              if (coords) {
                const [lat, lng] = coords;
                setTempMarkerCoords([lat, lng]);
              }
            }
          }}
        />
      );
    }
    return null;
  }, [isSelecting, tempMarkerCoords]);

  const isHoveredInRoute = hoveredPlace ? route.some((p) => p.id === hoveredPlace.id) : false;

  return (
    <div className={`h-full w-full relative overflow-hidden ${className}`} ref={containerRef}>
      <YMaps
        query={{
          apikey: "2ccd62a3-8204-4560-9c6d-128722d4d938",
          lang: "ru_RU",
        }}
      >
        <YandexMap
          defaultState={{ center: mapCenter, zoom: 13 }}
          width="100%"
          height="100%"
          onClick={handleMapClick}
          instanceRef={handleMapInstance}
        >
          {markers}
          {selectingMarker}
        </YandexMap>
      </YMaps>

      {!isMobile && hoveredPlace && popupPosition && (
        <div
          className="fixed bg-white rounded-lg shadow-lg p-3 z-50 max-w-[240px] pointer-events-auto"
          style={{
            left: popupPosition.x + 12,
            top: popupPosition.y - 20,
            transform: "translate(0, -50%)",
          }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <h4 className="text-sm font-bold text-gray-900">{hoveredPlace.name}</h4>
          <p className="text-xs text-gray-500 mt-1">{hoveredPlace.category}</p>
          <div className="flex gap-2 mt-2">
            <button
              className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition whitespace-nowrap"
              onClick={() => handlePlaceClick(hoveredPlace)}
            >
              Подробнее
            </button>
            <button
              className={`flex-1 px-2 py-1 text-white text-xs rounded-md transition whitespace-nowrap ${
                isHoveredInRoute
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
              onClick={() => handleToggleRoute(hoveredPlace)}
            >
              {isHoveredInRoute ? "В маршруте" : "В маршрут"}
            </button>
          </div>
        </div>
      )}

      {isSelecting && (
        <button
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-green-500 text-white font-medium rounded-lg shadow-lg hover:bg-green-600 transition disabled:opacity-50"
          onClick={handleConfirmCoords}
          disabled={!tempMarkerCoords}
        >
          {tempMarkerCoords ? "Подтвердить выбор" : "Выберите точку на карте"}
        </button>
      )}

      <PlaceDetailsModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Map;