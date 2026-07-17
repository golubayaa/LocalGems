// src/api/places.ts
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
  photoUrls?: string[];
  photos?: File[];
}

export interface CreateSuggestionFormData {
  name: string;
  description?: string;
  category: string;
  latitude: number;
  longitude: number;
  tags?: string[];
  photos: File[];
}

export interface CreateSuggestionPayload {
  name: string;
  description: string;
  category: number;
  latitude: number;
  longitude: number;
  tags?: string[];
  photos?: File[];
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

const normalizePhotoUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) {
    return undefined;
  }

  const withProtocol = trimmed.startsWith("http://")
    ? trimmed.replace(/^http:\/\//, "https://")
    : trimmed.startsWith("https://") || trimmed.startsWith("//")
      ? trimmed.startsWith("//") ? `https:${trimmed}` : trimmed
      : `https://${trimmed}`;

  if (withProtocol.includes("images.unsplash.com")) {
    return withProtocol.split("?")[0];
  }

  return withProtocol;
};

const extractPhotoUrl = (item: Record<string, unknown>): string | undefined => {
  const seen = new WeakSet<object>();
  const stack: Array<{ value: unknown; path: string[] }> = [{ value: item, path: [] }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const { value, path } = current;

    if (typeof value === "string") {
      const normalized = normalizePhotoUrl(value);
      if (normalized) {
        const looksLikePhotoKey = path.some((segment) => /photo|image/i.test(segment));
        if (looksLikePhotoKey || /^(https?:\/\/|\/\/)/i.test(value.trim())) {
          return normalized;
        }
      }
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value.slice().reverse()) {
        stack.push({ value: entry, path });
      }
      continue;
    }

    if (value && typeof value === "object") {
      if (seen.has(value)) {
        continue;
      }
      seen.add(value);

      const record = value as Record<string, unknown>;
      for (const [key, child] of Object.entries(record).reverse()) {
        stack.push({ value: child, path: [...path, key] });
      }
    }
  }

  return undefined;
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
  const photoUrl = extractPhotoUrl(item);

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
    photoUrl,
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

export const storageApi = {
  // Загрузка одного файла
  uploadFile: async (file: File, folder: string = 'suggestions'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{ url: string }>(
      `/storage/upload?folder=${folder}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.url;
  },

  // Загрузка нескольких файлов
  uploadMultipleFiles: async (files: File[], folder: string = 'suggestions'): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await apiClient.post<{ urls: string[] }>(
      `/storage/upload-multiple?folder=${folder}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.urls;
  },
};

export const placesApi = {
  list: async (params: PlacesQueryParams = {}): Promise<Place[]> => {
    const requestedSize = params.size ?? 1400;
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

  createSuggestion: async (payload: CreateSuggestionFormData): Promise<Place> => {
    let photoUrls: string[] = [];
    
    // 1. Загружаем фото (если есть)
    if (payload.photos && payload.photos.length > 0) {
      try {
        photoUrls = await storageApi.uploadMultipleFiles(payload.photos, 'suggestions');
      } catch (error) {
        console.error('Failed to upload photos:', error);
        // Продолжаем без фото или выбрасываем ошибку
        // throw new Error('Photo upload failed');
      }
    }

    // 2. Создаём FormData для отправки предложения
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description ?? '');
    formData.append('category', payload.category);
    formData.append('latitude', payload.latitude.toString());
    formData.append('longitude', payload.longitude.toString());
    
    if (payload.tags && payload.tags.length > 0) {
      formData.append('tags', JSON.stringify(payload.tags));
    }
    
    // 3. Добавляем URL фото (первое как основное)
    if (photoUrls.length > 0) {
      formData.append('photoUrl', photoUrls[0]);
      if (photoUrls.length > 1) {
        formData.append('photos', JSON.stringify(photoUrls));
      }
    }

    // 4. Отправляем на сервер
    const response = await apiClient.post<Record<string, unknown>>(
      '/suggestions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      id: response.data.id as string,
      name: response.data.name as string,
      category: payload.category,
      address: '',
      status: 'moderation',
      lat: payload.latitude,
      lng: payload.longitude,
      description: payload.description,
      photoUrl: photoUrls[0],
      photos: photoUrls,
    };
  },

  // ✅ ДОБАВЛЯЕМ МЕТОД approveSuggestion
  approveSuggestion: async (id: string, comment?: string) => {
    const response = await apiClient.post(`/suggestions/${id}/approve`, { comment });
    return response.data;
  },
};

export { mapCategoryCodeToLabel };