/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Map/PlaceDetailsModal.tsx
import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import type { Place } from "../../data/mockPlaces";

interface PlaceDetailsModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
}

const PlaceDetailsModal = ({ place, isOpen, onClose }: PlaceDetailsModalProps) => {
  const { favorites, route, isAuth, addFavorite, removeFavorite, addToRoute, removeFromRoute } = useStore();
  const [shareMessage, setShareMessage] = useState("Поделиться");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setShareMessage("Поделиться");
    }
  }, [isOpen]);

  if (!isOpen || !place) return null;

  const isFavorite = favorites.some((p) => p.id === place.id);
  const isInRoute = route.some((p) => p.id === place.id);

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavorite(place.id);
    } else {
      addFavorite(place);
    }
  };

  const handleToggleRoute = () => {
    if (isInRoute) {
      removeFromRoute(place.id);
    } else {
      addToRoute(place);
    }
  };

  const handleShare = () => {
    const shareText = `${place.name}\n${place.address}\nКоординаты: ${place.lat}, ${place.lng}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setShareMessage("Скопировано ✅");
        setTimeout(() => setShareMessage("Поделиться"), 2500);
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareMessage("Скопировано ✅");
      setTimeout(() => setShareMessage("Поделиться"), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[640px] max-h-[90vh] overflow-y-auto p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="w-full h-48 bg-gray-200" />

        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">{place.name}</h2>
          <p className="text-sm text-gray-500">{place.category}</p>
          <p className="text-sm text-gray-600">{place.address}</p>
          {place.description && (
            <p className="text-sm text-gray-700 mt-2">{place.description}</p>
          )}

          <div className="flex gap-3 pt-4">
            {isAuth && (
              <button
                onClick={handleToggleFavorite}
                className={`flex-1 h-11 text-sm font-medium rounded-lg transition ${
                  isFavorite
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isFavorite ? "В избранном" : "В избранное"}
              </button>
            )}

            <button
              onClick={handleToggleRoute}
              className={`flex-1 h-11 text-sm font-medium rounded-lg transition ${
                isInRoute
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {isInRoute ? "В маршруте" : "В маршрут"}
            </button>

            <button
              onClick={handleShare}
              className="flex-1 h-11 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
            >
              {shareMessage}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailsModal;