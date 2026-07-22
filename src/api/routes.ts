// src/api/routes.ts
import { apiClient } from "./client";

export interface RouteWaypointResponse {
  id: string;
  placeId: string;
  orderIndex: number;
  addedAt: string; // ISO 8601
}

export interface RouteResponse {
  id: string;
  userId: string;
  name: string;
  waypoints: RouteWaypointResponse[];
  createdAt: string;
  updatedAt: string;
}

// Request DTO
interface RouteRequest {
  name: string;
}

interface AddWaypointRequest {
  placeId: string;
}

export const routesApi = {
  list: async (): Promise<RouteResponse[]> => {
    const response = await apiClient.get<{ routes: RouteResponse[] }>("/routes");
    return response.data.routes;
  },

  getById: async (id: string): Promise<RouteResponse> => {
    const response = await apiClient.get<RouteResponse>(`/routes/${id}`);
    return response.data;
  },

  create: async (name: string): Promise<RouteResponse> => {
    const body: RouteRequest = { name };
    const response = await apiClient.post<RouteResponse>("/routes", body);
    return response.data;
  },

  update: async (id: string, name: string): Promise<RouteResponse> => {
    const body: RouteRequest = { name };
    const response = await apiClient.put<RouteResponse>(`/routes/${id}`, body);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/routes/${id}`);
    // Бэк возвращает 204 No Content — тела нет
  },

  addWaypoint: async (id: string, placeId: string): Promise<RouteResponse> => {
    const body: AddWaypointRequest = { placeId };
    const response = await apiClient.post<RouteResponse>(
      `/routes/${id}/waypoints`,
      body
    );
    return response.data;
  },

  removeWaypoint: async (id: string, placeId: string): Promise<RouteResponse> => {
    const response = await apiClient.delete<RouteResponse>(
      `/routes/${id}/waypoints/${placeId}`
    );
    return response.data;
  },
};