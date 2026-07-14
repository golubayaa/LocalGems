// src/store/useStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type Place, mockPlaces } from "../data/mockPlaces";

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
  addPlace: (place: Omit<Place, "id">) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      favorites: [],
      route: [],
      places: mockPlaces,
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

      addPlace: (place) =>
        set((state) => ({
          places: [...state.places, { ...place, id: Date.now() }],
        })),

      // Мок-авторизация с улучшенной валидацией
      login: async (email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          throw new Error("Неверный формат почты");
        }
        if (password.length < 6) {
          throw new Error("Пароль должен быть не менее 6 символов");
        }
        const isModerator = email === "admin@localgems.com";
        set({
          isAuth: true,
          isModerator,
          userEmail: email,
          token: "mocked-jwt-token",
        });
        localStorage.setItem("authToken", "mocked-jwt-token");
      },

      register: async (email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          throw new Error("Неверный формат почты");
        }
        if (password.length < 6) {
          throw new Error("Пароль должен быть не менее 6 символов");
        }
        const isModerator = email === "admin@localgems.com";
        set({
          isAuth: true,
          isModerator,
          userEmail: email,
          token: "mocked-jwt-token",
        });
        localStorage.setItem("authToken", "mocked-jwt-token");
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