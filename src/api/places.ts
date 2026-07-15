import { apiClient } from "./client";
import { categories } from "../data/categories";
import type { Place } from "../data/mockPlaces";

interface PlacesQueryParams {
  search?: string;
  category?: string;
  page?: number;
  size?: number;
}

interface PlaceApiPayload {
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  tags?: string[];
}

const categoryLabels = categories as string[];

const mapCategoryCodeToLabel = (category: unknown): string => {
  if (typeof category === "number") {
    return categoryLabels[category] ?? "Неизвестно";
  }

  if (typeof category === "string") {
    return category;
  }

  return "Неизвестно";
};

const mapCategoryLabelToCode = (category: string): number => {
  const index = categoryLabels.findIndex((item) => item === category);
  return index >= 0 ? index : 0;
};

const mapStatus = (status?: unknown): Place["status"] => {
  if (typeof status === "string") {
    if (status === "published" || status === "rejected" || status === "moderation") {
      return status;
    }
  }

  if (typeof status === "number") {
    return status === 1 ? "published" : status === 2 ? "moderation" : "rejected";
  }

  return "moderation";
};

const isGuidLike = (value: unknown): value is string => {
  return typeof value === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value.trim());
};

const mapBackendPlace = (item: Record<string, unknown>): Place => {
  const latitude = Number(item.latitude ?? item.lat ?? 56.8389);
  const longitude = Number(item.longitude ?? item.lng ?? 60.6057);
  const rawId = item.id ?? item.Id ?? item.placeId ?? item.PlaceId ?? item.guid ?? item.Guid;
  const placeId = typeof rawId === "number"
    ? rawId
    : typeof rawId === "string"
      ? rawId.trim()
      : "";
  const guid = typeof placeId === "string" && isGuidLike(placeId) ? placeId : undefined;

  return {
    id: placeId,
    guid,
    name: String(item.name ?? "Без названия"),
    category: mapCategoryCodeToLabel(item.category),
    address: String(item.address ?? item.location ?? "Адрес не указан"),
    status: mapStatus(item.status),
    rating: typeof item.rating === "number" ? item.rating : undefined,
    lat: Number.isFinite(latitude) ? latitude : 56.8389,
    lng: Number.isFinite(longitude) ? longitude : 60.6057,
    description: typeof item.description === "string" ? item.description : undefined,
  };
};

const normalizePlacesPayload = (payload: unknown): Place[] => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const places = Array.isArray(record.places)
      ? record.places
      : Array.isArray(record.items)
        ? record.items
        : [];

    return places.map((item) => mapBackendPlace(item as Record<string, unknown>));
  }

  return [];
};

export const placesApi = {
  list: async (params: PlacesQueryParams = {}): Promise<Place[]> => {
    const requestedSize = params.size ?? 300;
    const pageSize = 20;
    const collected: Place[] = [];
    let page = params.page ?? 1;

    while (collected.length < requestedSize) {
      const response = await apiClient.get<unknown>("/places", {
        params: {
          search: params.search || undefined,
          category: params.category ? mapCategoryLabelToCode(params.category) : undefined,
          page,
          size: pageSize,
        },
      });

      const pagePlaces = normalizePlacesPayload(response.data);
      if (pagePlaces.length === 0) {
        break;
      }

      collected.push(...pagePlaces);
      if (pagePlaces.length < pageSize) {
        break;
      }

      page += 1;
    }

    return collected.slice(0, requestedSize);
  },

  listPage: async (page: number, size: number, params: PlacesQueryParams = {}): Promise<Place[]> => {
    const response = await apiClient.get<unknown>("/places", {
      params: {
        search: params.search || undefined,
        category: params.category ? mapCategoryLabelToCode(params.category) : undefined,
        page,
        size,
      },
    });

    return normalizePlacesPayload(response.data);
  },

  getById: async (id: string): Promise<Place> => {
    const response = await apiClient.get<Record<string, unknown>>(`/places/${id}`);
    return mapBackendPlace(response.data);
  },

  createSuggestion: async (payload: PlaceApiPayload): Promise<Place> => {
    const response = await apiClient.post<Record<string, unknown>>("/suggestions", {
      name: payload.name,
      description: payload.description,
      category: mapCategoryLabelToCode(payload.category),
      latitude: payload.latitude,
      longitude: payload.longitude,
      tags: payload.tags ?? [],
    });

    return mapBackendPlace(response.data);
  },
};
