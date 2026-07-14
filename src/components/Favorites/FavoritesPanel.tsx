// src/components/Favorites/FavoritesPanel.tsx
import { useStore } from "../../store/useStore";
import FavoriteCard from "./FavoriteCard";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoritesPanel = ({ isOpen, onClose }: FavoritesPanelProps) => {
  const { favorites, route, removeFavorite, addToRoute, removeFromRoute } = useStore();

  if (!isOpen) return null;

  const handleAddToRoute = (id: number) => {
    const place = favorites.find((p) => p.id === id);
    if (place) {
      addToRoute(place);
    }
  };

  const handleRemoveFromRoute = (id: number) => {
    const place = favorites.find((p) => p.id === id);
    if (place) {
      removeFromRoute(id);
    }
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={onClose} />

      <aside
        className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-2xl pointer-events-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Избранное</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favorites.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">Нет избранных мест</p>
          ) : (
            favorites.map((place) => (
              <FavoriteCard
                key={place.id}
                place={place}
                isInRoute={route.some((p) => p.id === place.id)}
                onRemove={removeFavorite}
                onAddToRoute={handleAddToRoute}
                onRemoveFromRoute={handleRemoveFromRoute}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default FavoritesPanel;