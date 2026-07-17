// src/components/Moderator/PlaceRow.tsx
import type { Place } from "../../data/mockPlaces";

interface PlaceRowProps {
  place: Place;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onApprove?: (id: number) => void;
}

const PlaceRow = ({ place, onEdit, onDelete, onApprove }: PlaceRowProps) => {
  const statusColors = {
    published: "text-green-600",
    moderation: "text-orange-500",
  };

  const statusLabels = {
    published: "✅ Опубликовано",
    moderation: "⏳ На модерации",
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3 text-sm text-gray-900">{place.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{place.category}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{place.address}</td>
      <td className={`px-4 py-3 text-sm font-medium ${statusColors[place.status as keyof typeof statusColors]}`}>
        {statusLabels[place.status as keyof typeof statusLabels]}
      </td>
      <td className="px-4 py-3 text-sm">
        {place.status === "moderation" ? (
          // Для модерации: Редактировать, Утвердить, Удалить
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            <button
              onClick={() => onEdit(place.id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition text-left"
            >
              Редактировать
            </button>
            <button
              onClick={() => onApprove?.(place.id)}
              className="text-sm font-medium text-green-600 hover:text-green-800 transition text-left"
            >
              Утвердить
            </button>
            <button
              onClick={() => onDelete(place.id)}
              className="text-sm font-medium text-red-500 hover:text-red-700 transition text-left"
            >
              Удалить
            </button>
          </div>
        ) : (
          // Для опубликованных: Редактировать, Удалить
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
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