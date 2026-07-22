// src/hooks/useSuggest.ts
import { useState, useRef, useCallback } from "react";

interface SuggestItem {
  value: string;
  coordinates?: [number, number];
}

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
  const lastQueryRef = useRef<string>("");

  const fetchSuggest = useCallback(async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setItems([]);
      setIsOpen(false);
      return;
    }

    if (lastQueryRef.current === trimmed) {
      return;
    }
    lastQueryRef.current = trimmed;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setIsOpen(true);

    try {
      const apiKey = "a3809438-6608-4d4b-899b-fe93f8c08dd5";
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(trimmed)}&format=json&results=5&lang=ru_RU`;

      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as GeocoderResponse;
      const featureMembers = data?.response?.GeoObjectCollection?.featureMember || [];

      const suggestions = featureMembers
        .map((member) => {
          const geoObject = member.GeoObject;
          const address = geoObject?.metaDataProperty?.GeocoderMetaData?.text || geoObject?.name || "";
          const pos = geoObject?.Point?.pos;

          let coordinates: [number, number] | undefined;
          if (pos) {
            const [lng, lat] = pos.split(" ").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = [lat, lng];
            }
          }

          return { value: address, coordinates };
        })
        .filter((item) => item.value.length > 0);

      setItems(suggestions);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Suggest error:", error);
        setItems([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Новый метод: обратный геокодер
  const fetchAddressByCoords = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const apiKey = "a3809438-6608-4d4b-899b-fe93f8c08dd5";
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&lang=ru_RU&results=1`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const featureMember = data?.response?.GeoObjectCollection?.featureMember?.[0];
      const address = featureMember?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || null;

      return address;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }, []);

  const clearSuggest = useCallback(() => {
    setItems([]);
    setIsOpen(false);
    lastQueryRef.current = "";
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    items,
    isLoading,
    isOpen,
    setIsOpen,
    fetchSuggest,
    clearSuggest,
    fetchAddressByCoords,
  };
}