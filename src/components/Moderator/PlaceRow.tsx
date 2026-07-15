// src/components/Moderator/PlaceRow.tsx
import type { Place } from "../../data/mockPlaces";

interface PlaceRowProps {
  place: Place;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onApprove?: (id: number | string) => void;
  onReject?: (id: number | string) => void;
}

const PlaceRow = ({ place, onEdit, onDelete, onApprove, onReject }: PlaceRowProps) => {
  const statusColors = {
    published: "text-green-600",
    moderation: "text-orange-500",
    rejected: "text-red-500",
  };

  const statusLabels = {
    published: "✅ Опубликовано",
    moderation: "⏳ На модерации",
    rejected: "❌ Отклонено",
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3 text-sm text-gray-900">{place.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{place.category}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{place.address}</td>
      <td className={`px-4 py-3 text-sm font-medium ${statusColors[place.status]}`}>
        {statusLabels[place.status]}
      </td>
      <td className="px-4 py-3 text-sm">
        {place.status === "moderation" ? (
          // Для модерации: Утвердить и Отклонить
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <button
              onClick={() => onApprove?.(place.id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition text-left"
            >
              Утвердить
            </button>
            <button
              onClick={() => onReject?.(place.id)}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition text-left"
            >
              Отклонить
            </button>
          </div>
        ) : (
          // Для опубликованных/отклонённых: Редактировать и Удалить
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <button
              onClick={() => onEdit(place.id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition text-left"
            >
              Редактировать
            </button>
            <button
              onClick={() => onDelete(place.id)}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition text-left"
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