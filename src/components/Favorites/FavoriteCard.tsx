// src/components/Favorites/FavoriteCard.tsx
import type { Place } from "../../data/mockPlaces";

interface FavoriteCardProps {
  place: Place;
  isInRoute: boolean;
  onRemove: (id: number | string) => void;
  onAddToRoute: (id: number | string) => void;
  onRemoveFromRoute: (id: number | string) => void;
}

const FavoriteCard = ({
  place,
  isInRoute,
  onRemove,
  onAddToRoute,
  onRemoveFromRoute,
}: FavoriteCardProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Фото */}
      {place.photoUrl ? (
        <img
          src={place.photoUrl}
          alt={place.name}
          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {place.name || "Без названия"}
        </h4>
        <p className="text-xs text-gray-500">{place.category || "Неизвестно"}</p>
        <p className="text-xs text-gray-400 truncate">{place.address || "Адрес не указан"}</p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {isInRoute ? (
          <button
            onClick={() => onRemoveFromRoute(place.id)}
            className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition text-sm font-bold"
            title="Убрать из маршрута"
          >
            ✓
          </button>
        ) : (
          <button
            onClick={() => onAddToRoute(place.id)}
            className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition text-lg font-bold"
            title="Добавить в маршрут"
          >
            +
          </button>
        )}
        <button
          onClick={() => onRemove(place.id)}
          className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
          title="Удалить из избранного"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FavoriteCard;