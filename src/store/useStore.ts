// src/store/useStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "../api/auth";
import { placesApi, type CreateSuggestionPayload } from "../api/places";
import { wishlistApi } from "../api/wishlist";
import { routesApi } from "../api/routes";
import { type Place } from "../data/mockPlaces";

interface Store {
  favorites: Place[];
  route: Place[];
  places: Place[];
  isAuth: boolean;
  isModerator: boolean;
  userEmail: string;
  token: string | null;
  currentRouteId: string | null;
  addFavorite: (place: Place) => Promise<void>;
  removeFavorite: (id: number | string) => Promise<void>;
  addToRoute: (place: Place) => void;
  removeFromRoute: (id: number | string) => void;
  clearRoute: () => void;
  setPlaces: (places: Place[]) => void;
  addPlace: (placeData: CreateSuggestionPayload) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFavorites: () => Promise<void>;
  loadRoute: () => Promise<void>;
  syncRouteWithServer: () => Promise<void>;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      favorites: [],
      route: [],
      places: [],
      isAuth: false,
      isModerator: false,
      userEmail: "",
      token: null,
      currentRouteId: null,

      addFavorite: async (place) => {
        const existing = get().favorites.some((p) => p.id === place.id);
        if (existing) return;

        set((state) => ({
          favorites: [...state.favorites, place],
        }));

        if (!get().isAuth) return;

        try {
          const placeId = place.guid ?? String(place.id);
          await wishlistApi.addItem(placeId);
        } catch (error) {
          console.error("Не удалось сохранить избранное в backend", error);
          set((state) => ({
            favorites: state.favorites.filter((p) => p.id !== place.id),
          }));
        }
      },

      removeFavorite: async (id) => {
        const previousFavorites = get().favorites;
        set({
          favorites: previousFavorites.filter((p) => p.id !== id),
        });

        if (!get().isAuth) return;

        try {
          const place = get().favorites.find((item) => item.id === id);
          const placeId = place?.guid ?? String(place?.id ?? id);
          await wishlistApi.removeItem(placeId);
        } catch (error) {
          console.error("Не удалось удалить избранное из backend", error);
          set({ favorites: previousFavorites });
        }
      },

      addToRoute: (place) => {
        set((state) => ({
          route: state.route.some((p) => p.id === place.id)
            ? state.route
            : [...state.route, place],
        }));
        get().syncRouteWithServer();
      },

      removeFromRoute: (id) => {
        set((state) => ({
          route: state.route.filter((p) => p.id !== id),
        }));
        get().syncRouteWithServer();
      },

      clearRoute: () => {
        set({ route: [] });
        get().syncRouteWithServer();
      },

      setPlaces: (places) => set({ places }),

      addPlace: async (placeData: CreateSuggestionPayload) => {
        try {
          const createdPlace = await placesApi.createSuggestion({
            name: placeData.name,
            description: placeData.description ?? "",
            category: placeData.category,
            address: placeData.address,
            latitude: placeData.latitude,
            longitude: placeData.longitude,
            tags: placeData.tags ?? [],
            photos: placeData.photos ?? [],
          });
          console.log("Место успешно создано:", createdPlace);
        } catch (error) {
          console.error("Ошибка при создании места:", error);
          throw error;
        }
      },

      loadFavorites: async () => {
        if (!get().isAuth) {
          if (!get().token) {
            return;
          }
          set({ favorites: [] });
          return;
        }

        try {
          const favorites = await wishlistApi.list();
          set({ favorites });
        } catch (error) {
          console.error("Не удалось загрузить избранное из backend", error);
        }
      },

      loadRoute: async () => {
        if (!get().isAuth) {
          set({ route: [], currentRouteId: null });
          return;
        }

        try {
          const routes = await routesApi.list();
          if (routes.length > 0) {
            const firstRoute = routes[0];
            const placeIds = firstRoute.waypoints.map((wp) => wp.placeId);
            
            const places = await Promise.all(
              placeIds
                .filter((id): id is string => id !== null && id !== undefined && id !== "")
                .map((id) => placesApi.getById(id))
            );
            
            set({ 
              route: places, 
              currentRouteId: firstRoute.id 
            });
          } else {
            const newRoute = await routesApi.create("Мой маршрут");
            set({ 
              route: [], 
              currentRouteId: newRoute.id 
            });
          }
        } catch (error) {
          console.error("Failed to load route", error);
          set({ route: [], currentRouteId: null });
        }
      },

      syncRouteWithServer: async () => {
        const routeId = get().currentRouteId;
        if (!get().isAuth || !routeId) return;

        try {
          const currentPlaces = get().route;
          
          const serverRoute = await routesApi.getById(routeId);
          const serverPlaceIds = serverRoute.waypoints.map((wp) => wp.placeId);
          const localPlaceIds = currentPlaces.map((p) => String(p.id));

          for (const place of currentPlaces) {
            const placeId = String(place.id);
            if (!serverPlaceIds.includes(placeId)) {
              await routesApi.addWaypoint(routeId, placeId);
            }
          }

          for (const wp of serverRoute.waypoints) {
            if (!localPlaceIds.includes(wp.placeId)) {
              await routesApi.removeWaypoint(routeId, wp.placeId);
            }
          }
        } catch (error) {
          console.error("Failed to sync route with server", error);
        }
      },

      login: async (email: string, password: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          throw new Error("Неверный формат почты");
        }
        if (password.length < 6) {
          throw new Error("Пароль должен быть не менее 6 символов");
        }

        const response = await authApi.login({ email, password });
        const token = response.token ?? response.accessToken;

        if (!token) {
          throw new Error("Сервер не вернул токен авторизации");
        }

        const isModerator = response.role === "Admin" || email === "admin@localgems.com";
        set({
          isAuth: true,
          isModerator,
          userEmail: response.email || email,
          token,
        });
        localStorage.setItem("authToken", token);
        
        await get().loadFavorites();
        await get().loadRoute();
      },

      register: async (email: string, password: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          throw new Error("Неверный формат почты");
        }
        if (password.length < 6) {
          throw new Error("Пароль должен быть не менее 6 символов");
        }

        const response = await authApi.register({
          email,
          password,
          name: email.split("@")[0],
        });
        const token = response.token ?? response.accessToken;

        if (!token) {
          throw new Error("Сервер не вернул токен авторизации");
        }

        const isModerator = response.role === "Admin" || email === "admin@localgems.com";
        set({
          isAuth: true,
          isModerator,
          userEmail: response.email || email,
          token,
        });
        localStorage.setItem("authToken", token);
        
        await get().loadFavorites();
        await get().loadRoute();
      },

      logout: () => {
        set({
          isAuth: false,
          isModerator: false,
          userEmail: "",
          token: null,
          favorites: [],
          route: [],
          currentRouteId: null,
        });
        localStorage.removeItem("authToken");
      },
    }),
    {
      name: "localgems-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuth: state.isAuth,
        isModerator: state.isModerator,
        userEmail: state.userEmail,
        token: state.token,
        route: state.route,
        currentRouteId: state.currentRouteId,
      }),

      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version === 0) {
          return {
            ...state,
            route: (state.route as Place[]) ?? [],
            currentRouteId: null,
          };
        }
        return state;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate store:", error);
        } else if (state) {
          console.log("Store rehydrated successfully");
        }
      },
    }
  )
);