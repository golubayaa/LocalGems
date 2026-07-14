// src/components/Route/RoutePointItem.tsx
import type { Place } from "../../data/mockPlaces";

interface RoutePointItemProps {
  point: Place;
  index: number;
  onRemove: (id: number) => void;
}

const RoutePointItem = ({ point, index, onRemove }: RoutePointItemProps) => {
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
      <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-sm font-bold rounded-full flex-shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{point.name}</h4>
        <p className="text-xs text-gray-500 truncate">{point.address}</p>
      </div>
      <button
        onClick={() => onRemove(point.id)}
        className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition flex-shrink-0"
        title="Удалить точку"
      >
        ✕
      </button>
    </div>
  );
};

export default RoutePointItem;