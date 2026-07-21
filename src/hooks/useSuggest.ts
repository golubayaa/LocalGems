// src/hooks/useSuggest.ts
import { useState, useRef, useCallback } from "react";

interface SuggestItem {
  value: string;
  coordinates?: [number, number];
}

// Тип для ответа от геокодера
interface GeocoderResponse {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject: {
          metaDataProperty?: {
            GeocoderMetaData?: {
              text?: string;
            };
          };
          name?: string;
          Point?: {
            pos?: string;
          };
        };
      }>;
    };
  };
}

export function useSuggest() {
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggest = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setItems([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiKey = "2ccd62a3-8204-4560-9c6d-128722d4d938";
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=5`;

      const response = await fetch(url, { signal: controller.signal });
      const data = (await response.json()) as GeocoderResponse;

      const featureMembers = data?.response?.GeoObjectCollection?.featureMember || [];
      const suggestions = featureMembers.map((member) => {
        const geoObject = member.GeoObject;
        const address = geoObject?.metaDataProperty?.GeocoderMetaData?.text || geoObject?.name || "";
        const pos = geoObject?.Point?.pos;
        let coordinates: [number, number] | undefined;
        if (pos) {
          const [lng, lat] = pos.split(" ").map(Number);
          coordinates = [lat, lng];
        }
        return { value: address, coordinates };
      });

      setItems(suggestions);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Suggest error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggest = () => {
    setItems([]);
    setIsOpen(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return { items, isLoading, isOpen, setIsOpen, fetchSuggest, clearSuggest };
}