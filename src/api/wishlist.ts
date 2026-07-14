import { apiClient } from "./client";
import type { Place } from "../data/mockPlaces";

export const wishlistApi = {
  list: async (): Promise<Place[]> => {
    const response = await apiClient.get<unknown[]>("/wishlist");
    const payload = Array.isArray(response.data) ? response.data : [];
    return payload.map((item) => ({
      id: Number((item as Record<string, unknown>).id ?? Date.now()),
      name: String((item as Record<string, unknown>).name ?? "Без названия"),
      category: String((item as Record<string, unknown>).category ?? "Неизвестно"),
      address: String((item as Record<string, unknown>).address ?? "Адрес не указан"),
      status: "published",
      lat: Number((item as Record<string, unknown>).latitude ?? (item as Record<string, unknown>).lat ?? 56.8389),
      lng: Number((item as Record<string, unknown>).longitude ?? (item as Record<string, unknown>).lng ?? 60.6057),
      description: typeof (item as Record<string, unknown>).description === "string" ? String((item as Record<string, unknown>).description) : undefined,
    }));
  },

  addItem: async (placeId: string): Promise<void> => {
    await apiClient.post("/wishlist/items", { placeId });
  },

  removeItem: async (placeId: string): Promise<void> => {
    await apiClient.delete(`/wishlist/items/${placeId}`);
  },
};
