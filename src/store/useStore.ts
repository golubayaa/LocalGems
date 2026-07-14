// src/store/useStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "../api/auth";
import { placesApi } from "../api/places";
import { type Place } from "../data/mockPlaces";

interface Store {
  favorites: Place[];
  route: Place[];
  places: Place[];
  isAuth: boolean;
  isModerator: boolean;
  userEmail: string;
  token: string | null;
  addFavorite: (place: Place) => void;
  removeFavorite: (id: number) => void;
  addToRoute: (place: Place) => void;
  removeFromRoute: (id: number) => void;
  clearRoute: () => void;
  setPlaces: (places: Place[]) => void;
  addPlace: (place: Omit<Place, "id">) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      favorites: [],
      route: [],
      places: [],
      isAuth: false,
      isModerator: false,
      userEmail: "",
      token: null,

      addFavorite: (place) =>
        set((state) => ({
          favorites: state.favorites.some((p) => p.id === place.id)
            ? state.favorites
            : [...state.favorites, place],
        })),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((p) => p.id !== id),
        })),

      addToRoute: (place) =>
        set((state) => ({
          route: state.route.some((p) => p.id === place.id)
            ? state.route
            : [...state.route, place],
        })),

      removeFromRoute: (id) =>
        set((state) => ({
          route: state.route.filter((p) => p.id !== id),
        })),

      clearRoute: () => set({ route: [] }),

      setPlaces: (places) => set({ places }),

      addPlace: async (place) => {
        const createdPlace = await placesApi.createSuggestion({
          name: place.name,
          description: place.description ?? "",
          category: place.category,
          latitude: place.lat,
          longitude: place.lng,
          tags: [],
        });

        set((state) => ({
          places: [...state.places, createdPlace],
        }));
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
      },

      logout: () => {
        set({
          isAuth: false,
          isModerator: false,
          userEmail: "",
          token: null,
        });
        localStorage.removeItem("authToken");
      },
    }),
    {
      name: "localgems-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuth: state.isAuth,
        isModerator: state.isModerator,
        userEmail: state.userEmail,
        token: state.token,
      }),
    }
  )
);