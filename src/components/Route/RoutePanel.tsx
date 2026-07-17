// src/components/Route/RoutePanel.tsx
import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import RoutePointItem from "./RoutePointItem";
import ConfirmModal from "../Moderator/ConfirmModal";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

interface RoutePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoutePanel = ({ isOpen, onClose }: RoutePanelProps) => {
  const { route, removeFromRoute, clearRoute } = useStore();
  const [showConfirm, setShowConfirm] = useState(false);
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

  const handleExport = () => {
    if (route.length === 0) return;
    const coords = route.map((p) => `${p.lat},${p.lng}`).join("~");
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
        {/* Ручка */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 flex-shrink-0">
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

        <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
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
      </div>

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