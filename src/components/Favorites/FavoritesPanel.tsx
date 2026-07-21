// src/components/Favorites/FavoritesPanel.tsx
import { useEffect } from "react";
import { useStore } from "../../store/useStore";
import FavoriteCard from "./FavoriteCard";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoritesPanel = ({ isOpen, onClose }: FavoritesPanelProps) => {
  const { favorites, route, removeFavorite, addToRoute, removeFromRoute } = useStore();
  const isMobile = !useMediaQuery("(min-width: 768px)");

  const { panelRef, handleTouchStart, handleTouchMove, handleTouchEnd, style } = useSwipeToClose({
    isOpen,
    onClose,
    threshold: 80,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddToRoute = (id: number | string) => {
    const place = favorites.find((p) => p.id === id);
    if (place) {
      addToRoute(place);
    }
  };

  const handleRemoveFromRoute = (id: number | string) => {
    const place = favorites.find((p) => p.id === id);
    if (place) {
      removeFromRoute(id);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={panelRef}
        className={`
          absolute bg-white shadow-2xl flex flex-col
          ${isMobile
            ? "left-0 right-0 rounded-t-2xl"
            : "top-0 right-0 w-[400px] h-full"
          }
        `}
        style={{
          top: isMobile ? "40px" : "0",
          bottom: isMobile ? "0" : "auto",
          height: isMobile ? "auto" : "100%",
          ...style,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        <div
          className={`flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0 ${
            isMobile ? "pb-3 pt-0" : "pb-3 pt-4"
          }`}
        >
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
      </div>
    </div>
  );
};

export default FavoritesPanel;