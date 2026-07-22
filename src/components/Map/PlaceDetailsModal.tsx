/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Map/PlaceDetailsModal.tsx
import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import type { Place } from "../../data/mockPlaces";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

interface PlaceDetailsModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
}

const PlaceDetailsModal = ({ place, isOpen, onClose }: PlaceDetailsModalProps) => {
  const { favorites, route, isAuth, addFavorite, removeFavorite, addToRoute, removeFromRoute } = useStore();
  const [shareMessage, setShareMessage] = useState("Поделиться");
  const [imageError, setImageError] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
      setImageError(false);
      setCurrentPhotoIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setImageError(false);
    setCurrentPhotoIndex(0);
  }, [place?.id]);

  if (!isOpen || !place) return null;

  const allPhotos = place.photos && place.photos.length > 0
    ? place.photos
    : place.photoUrl
      ? [place.photoUrl]
      : [];

  const currentPhoto = allPhotos[currentPhotoIndex] || null;

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
        setShareMessage("Скопировано");
        setTimeout(() => setShareMessage("Поделиться"), 2500);
      });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareMessage("Скопировано");
      setTimeout(() => setShareMessage("Поделиться"), 2500);
    }
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
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
        {/* Фото — объект-cover, без искажений, без полос */}
        <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition z-10"
          >
            ✕
          </button>

          {currentPhoto && !imageError ? (
            <img
              src={currentPhoto}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={() => {
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
              Фото отсутствует
            </div>
          )}

          {allPhotos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 rounded-full flex items-center justify-center hover:bg-white transition z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/70 rounded-full flex items-center justify-center hover:bg-white transition z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </>
          )}
        </div>

        {/* Миниатюры */}
        {allPhotos.length > 1 && (
          <div className="flex gap-1 p-2 overflow-x-auto bg-white border-b border-gray-100">
            {allPhotos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPhotoIndex(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                  idx === currentPhotoIndex ? "border-blue-600" : "border-transparent hover:border-gray-300"
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

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
              className="flex-1 h-11 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1"
            >
              {shareMessage === "Скопировано" && <Check className="w-4 h-4 text-green-600" />}
              {shareMessage}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailsModal;