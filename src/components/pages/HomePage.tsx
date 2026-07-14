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

const HomePage = () => {
  const places = useStore((state) => state.places);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isRouteOpen, setIsRouteOpen] = useState(false);

  const allCategories = categories;

  useEffect(() => {
    (window as any).openAddPlaceModal = () => setIsAddModalOpen(true);
    (window as any).openFavoritesPanel = () => setIsFavoritesOpen(true);
    (window as any).openRoutePanel = () => setIsRouteOpen(true);
    return () => {
      delete (window as any).openAddPlaceModal;
      delete (window as any).openFavoritesPanel;
      delete (window as any).openRoutePanel;
    };
  }, []);

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
    <div className="flex w-full h-[calc(100vh-64px)]">
      <LeftPanel
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onResetFilters={resetFilters}
        categories={allCategories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSetCenter={handleSetCenter}
      />
      <main className="flex-1 relative">
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
    </div>
  );
};

export default HomePage;