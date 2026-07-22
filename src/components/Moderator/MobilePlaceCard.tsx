// src/components/Moderator/MobilePlaceCard.tsx
import type { Place } from "../../data/mockPlaces";
import StatusBadge from "./StatusBadge";

interface MobilePlaceCardProps {
  place: Place;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string) => void;
  isProcessing?: boolean;
}

const MobilePlaceCard = ({ place, onEdit, onDelete, onApprove, isProcessing = false }: MobilePlaceCardProps) => {
  const id = String(place.id);

  return (
    <div className={`bg-white rounded-lg shadow p-4 flex flex-col gap-2 ${isProcessing ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{place.name}</h3>
          <p className="text-sm text-gray-600 truncate">{place.category}</p>
          <p className="text-sm text-gray-500 truncate">{place.address}</p>
        </div>
        <StatusBadge status={place.status} className="ml-2" />
      </div>
      <div className="flex flex-wrap justify-center items-center gap-1 mt-1 border-t border-gray-100 pt-2">
        <button
          onClick={() => onEdit(id)}
          disabled={isProcessing}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Редактировать
        </button>
        <span className="text-gray-300 text-sm">|</span>
        {place.status === "moderation" ? (
          <>
            <button
              onClick={() => onApprove?.(id)}
              disabled={isProcessing}
              className="text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "..." : "Утвердить"}
            </button>
            <span className="text-gray-300 text-sm">|</span>
          </>
        ) : null}
        <button
          onClick={() => onDelete(id)}
          disabled={isProcessing}
          className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "..." : "Удалить"}
        </button>
      </div>
    </div>
  );
};

export default MobilePlaceCard;