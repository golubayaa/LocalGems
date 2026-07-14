// src/components/LeftPanel/LeftPanel.tsx
interface LeftPanelProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onResetFilters: () => void;
  categories: string[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSetCenter: (lat: number, lng: number) => void;
}

// Расширяем Window для глобальной функции
declare global {
  interface Window {
    openRoutePanel?: () => void;
  }
}

const LeftPanel = ({
  selectedCategories,
  onToggleCategory,
  onResetFilters,
  categories,
  searchTerm,
  onSearchChange,
  onSetCenter,
}: LeftPanelProps) => {
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onSetCenter(latitude, longitude);
      },
      () => {
        alert("Не удалось определить ваше местоположение");
      }
    );
  };

  const handleOpenRoute = () => {
    if (window.openRoutePanel) {
      window.openRoutePanel();
    }
  };

  return (
    <aside className="w-[300px] h-full bg-white shadow-md overflow-y-auto p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">Категории</h2>

      <div className="flex flex-col gap-2">
        {categories.map((cat) => (
          <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-600"
              checked={selectedCategories.includes(cat)}
              onChange={() => onToggleCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </div>

      <div className="relative mt-2">
        <input
          type="text"
          placeholder="Поиск мест..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-3 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6.5" cy="6.5" r="5.75" fill="white" stroke="black" strokeWidth="1.5" />
            <line x1="11.2021" y1="11" x2="17" y2="16.7979" stroke="black" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <button
        onClick={onResetFilters}
        className="text-sm text-gray-500 underline-offset-2 hover:text-gray-700 text-left"
      >
        Сбросить фильтры
      </button>

      <button
        onClick={handleFindNearby}
        className="w-full h-11 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
      >
        Найти рядом
      </button>

      <button
        onClick={handleOpenRoute}
        className="w-full h-11 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
      >
        Мой маршрут
      </button>
    </aside>
  );
};

export default LeftPanel;