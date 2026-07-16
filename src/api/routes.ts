import { apiClient } from "./client";

interface CreateRouteRequest {
  name: string;
}

interface AddWaypointRequest {
  placeId: string;
}

export const routesApi = {
  list: async (): Promise<unknown[]> => {
    const response = await apiClient.get<unknown[]>("/routes");
    return response.data;
  },

  getById: async (id: string): Promise<unknown> => {
    const response = await apiClient.get<unknown>(`/routes/${id}`);
    return response.data;
  },

  create: async (name: string): Promise<unknown> => {
    const response = await apiClient.post<unknown>("/routes", { name } satisfies CreateRouteRequest);
    return response.data;
  },

  update: async (id: string, name: string): Promise<unknown> => {
    const response = await apiClient.put<unknown>(`/routes/${id}`, { name } satisfies CreateRouteRequest);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/routes/${id}`);
  },

  addWaypoint: async (id: string, placeId: string): Promise<void> => {
    await apiClient.post(`/routes/${id}/waypoints`, { placeId } satisfies AddWaypointRequest);
  },

  removeWaypoint: async (id: string, placeId: string): Promise<void> => {
    await apiClient.delete(`/routes/${id}/waypoints/${placeId}`);
  },

  exportYandex: async (id: string): Promise<void> => {
    await apiClient.get(`/routes/${id}/export/yandex`);
  },
};
