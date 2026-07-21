/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/pages/HomePage.tsx
import { useState, useEffect } from "react";
import LeftPanel from "../LeftPanel/LeftPanel";
import Map from "../Map/Map";
import AddPlaceModal from "../Map/AddPlaceModal";
import FavoritesPanel from "../Favorites/FavoritesPanel";
import RoutePanel from "../Route/RoutePanel";
import { useStore } from "../../store/useStore";
import { categories } from "../../data/categories";
import { placesApi } from "../../api/places";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const HomePage = () => {
  const places = useStore((state) => state.places);
  const setPlaces = useStore((state) => state.setPlaces);
  const { isAuth, isModerator } = useStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMobile = !useMediaQuery("(min-width: 768px)");

  const allCategories = categories;

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const remotePlaces = await placesApi.list({ size: 300 });
        setPlaces(remotePlaces);
      } catch (error) {
        console.error("Failed to load places", error);
      }
    };

    loadPlaces();

    (window as any).openAddPlaceModal = () => setIsAddModalOpen(true);
    (window as any).openFavoritesPanel = () => setIsFavoritesOpen(true);
    (window as any).openRoutePanel = () => setIsRouteOpen(true);
    (window as any).toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

    return () => {
      delete (window as any).openAddPlaceModal;
      delete (window as any).openFavoritesPanel;
      delete (window as any).openRoutePanel;
      delete (window as any).toggleMobileMenu;
    };
  }, [setPlaces]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSearchTerm("");
    setIsMobileMenuOpen(false);
  };

  const handleSetCenter = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  };

  const filteredPlaces = places.filter((place) => {
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(place.category);
    const matchesSearch =
      searchTerm.trim() === "" ||
      place.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
      {!isMobile && (
        <LeftPanel
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onResetFilters={resetFilters}
          categories={allCategories}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSetCenter={handleSetCenter}
        />
      )}

      <main className="flex-1 relative overflow-hidden">
        <Map places={filteredPlaces} center={mapCenter} />
        <AddPlaceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        <FavoritesPanel
          isOpen={isFavoritesOpen}
          onClose={() => setIsFavoritesOpen(false)}
        />
        <RoutePanel
          isOpen={isRouteOpen}
          onClose={() => setIsRouteOpen(false)}
        />
      </main>

      {/* Мобильное боковое меню (поверх всего) */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          {/* Затемнение */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          {/* Панель */}
          <div className="relative w-[300px] h-full bg-white shadow-2xl p-4 flex flex-col gap-2 overflow-y-auto">
            {/* Заголовок "Меню" и крестик */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-xl font-bold text-gray-900">Меню</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 text-2xl">✕</button>
            </div>

            {/* Поиск */}
            <div className="relative mb-1">
              <input
                type="text"
                placeholder="Поиск мест..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-3 pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6.5" cy="6.5" r="5.75" fill="white" stroke="black" strokeWidth="1.5" />
                  <line x1="11.2021" y1="11" x2="17" y2="16.7979" stroke="black" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
            </div>

            {/* Категории (чекбоксы) — без заголовка */}
            <div className="flex flex-col gap-1.5 mb-1">
              {allCategories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>

            {/* Сбросить фильтры */}
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 underline-offset-2 hover:text-gray-700 text-left mb-1"
            >
              Сбросить фильтры
            </button>

            {/* Найти рядом */}
            <button
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Геолокация не поддерживается вашим браузером");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    handleSetCenter(pos.coords.latitude, pos.coords.longitude);
                    setIsMobileMenuOpen(false);
                  },
                  () => alert("Не удалось определить ваше местоположение")
                );
              }}
              className="w-full h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Найти рядом
            </button>

            {/* Мой маршрут */}
            <button
              onClick={() => {
                if (window.openRoutePanel) window.openRoutePanel();
                setIsMobileMenuOpen(false);
              }}
              className="w-full h-10 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
            >
              Мой маршрут
            </button>

            {/* Для авторизованных пользователей: разделитель и кнопки */}
            {isAuth && !isModerator && (
              <>
                <hr className="border-t border-gray-300 my-1" />
                <button
                  onClick={() => {
                    if (window.openAddPlaceModal) window.openAddPlaceModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full h-10 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
                >
                  Добавить место
                </button>
                <button
                  onClick={() => {
                    if (window.openFavoritesPanel) window.openFavoritesPanel();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full h-10 bg-[#FF3B30] text-white text-sm font-medium rounded-lg hover:bg-[#E0352B] transition"
                >
                  Избранное
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;