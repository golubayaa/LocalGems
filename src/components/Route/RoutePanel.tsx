// src/components/Route/RoutePanel.tsx
import { useState } from "react";
import { useStore } from "../../store/useStore";
import RoutePointItem from "./RoutePointItem";
import ConfirmModal from "../Moderator/ConfirmModal";

interface RoutePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoutePanel = ({ isOpen, onClose }: RoutePanelProps) => {
  const { route, removeFromRoute, clearRoute } = useStore();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (route.length === 0) return;
    const coords = route.map((p) => `${p.lat},${p.lng}`).join("~");
    // Добавляем ~ перед координатами, чтобы начальная точка была пустой
    const url = `https://yandex.ru/maps/?rtext=~${coords}&rtt=auto`;
    window.open(url, "_blank");
  };

  const handleClear = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    clearRoute();
    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside
        className="absolute top-0 right-0 w-[400px] h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Мой маршрут</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {route.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">Нет точек маршрута</p>
          ) : (
            route.map((point, index) => (
              <RoutePointItem
                key={point.id}
                point={point}
                index={index}
                onRemove={removeFromRoute}
              />
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={handleClear}
            className="text-sm font-medium text-red-500 hover:text-red-700 transition"
          >
            Очистить маршрут
          </button>
          <button
            onClick={handleExport}
            disabled={route.length === 0}
            className="w-full h-11 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            Экспорт в Яндекс.Карты
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showConfirm}
        message="Вы уверены, что хотите очистить маршрут?"
        onConfirm={confirmClear}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default RoutePanel;