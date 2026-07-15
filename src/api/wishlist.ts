import { apiClient } from "./client";
import type { Place } from "../data/mockPlaces";

const isGuidLike = (value: unknown): value is string => {
  return typeof value === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value.trim());
};

const normalizePlaceId = (placeId: number | string): string => {
  return typeof placeId === "string" ? placeId.trim() : String(placeId);
};

const normalizeWishlistPayload = (payload: unknown): unknown[] => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const items = Array.isArray(record.items) ? record.items : Array.isArray(record.places) ? record.places : [];
    return items;
  }

  return [];
};

const mapWishlistItem = (item: Record<string, unknown>): Place => {
  const payload = item.place && typeof item.place === "object"
    ? (item.place as Record<string, unknown>)
    : item;

  const idValue = payload.id ?? item.id ?? item.placeId ?? item.PlaceId;
  const placeId = typeof idValue === "number"
    ? idValue
    : typeof idValue === "string"
      ? idValue.trim()
      : "";
  const guid = typeof placeId === "string" && isGuidLike(placeId) ? placeId : undefined;
  const latitude = Number(payload.latitude ?? payload.lat ?? item.latitude ?? item.lat ?? 56.8389);
  const longitude = Number(payload.longitude ?? payload.lng ?? item.longitude ?? item.lng ?? 60.6057);

  return {
    id: placeId,
    guid,
    name: String(payload.name ?? item.name ?? "Без названия"),
    category: String(payload.category ?? item.category ?? "Неизвестно"),
    address: String(payload.address ?? payload.location ?? item.address ?? item.location ?? "Адрес не указан"),
    status: "published",
    lat: Number.isFinite(latitude) ? latitude : 56.8389,
    lng: Number.isFinite(longitude) ? longitude : 60.6057,
    description:
      typeof payload.description === "string"
        ? payload.description
        : typeof item.description === "string"
          ? item.description
          : undefined,
  };
};

export const wishlistApi = {
  list: async (): Promise<Place[]> => {
    const response = await apiClient.get<unknown>("/wishlist");
    const payload = normalizeWishlistPayload(response.data);
    return payload.map((item) => mapWishlistItem(item as Record<string, unknown>));
  },

  addItem: async (placeId: number | string): Promise<void> => {
    await apiClient.post("/wishlist/items", { PlaceId: normalizePlaceId(placeId) });
  },

  removeItem: async (placeId: number | string): Promise<void> => {
    await apiClient.delete(`/wishlist/items/${normalizePlaceId(placeId)}`);
  },
};
