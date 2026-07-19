// src/components/Moderator/PlaceRow.tsx
import type { Place } from "../../data/mockPlaces";

interface PlaceRowProps {
  place: Place;
  // ИЗМЕНЕНО: id теперь string (GUID), а не number
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  // НОВОЕ: состояние обработки для блокировки кнопок
  isProcessing?: boolean;
}

const PlaceRow = ({ place, onEdit, onDelete, onApprove, isProcessing = false }: PlaceRowProps) => {
  const statusColors = {
    published: "text-green-600",
    moderation: "text-orange-500",
  };

  const statusLabels = {
    published: "✅ Опубликовано",
    moderation: "⏳ На модерации",
  };

  // ⬇Приводим ID к строке для единообразия
  const placeId = String(place.id);

  return (
    <tr className={`hover:bg-gray-50 transition ${isProcessing ? "opacity-50" : ""}`}>
      <td className="px-4 py-3 text-sm text-gray-900">{place.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{place.category}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{place.address}</td>
      <td className={`px-4 py-3 text-sm font-medium ${statusColors[place.status as keyof typeof statusColors]}`}>
        {statusLabels[place.status as keyof typeof statusLabels]}
      </td>
      <td className="px-4 py-3 text-sm">
        {place.status === "moderation" ? (
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            <button
              onClick={() => onEdit(placeId)}
              disabled={isProcessing}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Редактировать
            </button>
            <button
              onClick={() => onApprove?.(placeId)}
              disabled={isProcessing}
              className="text-sm font-medium text-green-600 hover:text-green-800 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Обработка..." : "Утвердить"}
            </button>
            <button
              onClick={() => onDelete(placeId)}
              disabled={isProcessing}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Обработка..." : "Удалить"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <button
              onClick={() => onEdit(placeId)}
              disabled={isProcessing}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Редактировать
            </button>
            <button
              onClick={() => onDelete(placeId)}
              disabled={isProcessing}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Удалить
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default PlaceRow;