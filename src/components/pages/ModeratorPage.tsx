/* eslint-disable react-hooks/set-state-in-effect */
// src/components/pages/ModeratorPage.tsx
import { useState, useMemo, useEffect } from "react";
import { mockPlaces, type Place } from "../../data/mockPlaces";
import { categories } from "../../data/categories";
import PlaceRow from "../Moderator/PlaceRow";
import EditPlaceModal from "../Moderator/EditPlaceModal";
import ConfirmModal from "../Moderator/ConfirmModal";

const statuses = ["Все статусы", "Опубликовано", "На модерации", "Отклонено"];

// Количество записей на страницу
const ITEMS_PER_PAGE = 10;

const ModeratorPage = () => {
  const [places, setPlaces] = useState<Place[]>(mockPlaces);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "moderation">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPlaces = useMemo(() => {
    let filtered = places;

    if (search.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category)
      );
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((p) =>
        selectedStatuses.includes(p.status)
      );
    }

    if (activeTab === "moderation") {
      filtered = filtered.filter((p) => p.status === "moderation");
    }

    return filtered;
  }, [places, search, selectedCategories, selectedStatuses, activeTab]);

  // Вычисляем общее количество страниц
  const totalPages = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE);

  // Получаем текущую страницу данных
  const currentPlaces = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPlaces.slice(start, end);
  }, [filteredPlaces, currentPage]);

  // Сброс страницы при изменении фильтров (используем useEffect, а не useMemo)
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategories, selectedStatuses, activeTab]);

  const openConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
  };

  const handleEdit = (id: number) => {
    const place = places.find((p) => p.id === id);
    if (place) {
      setEditingPlace(place);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    openConfirm("Вы уверены, что хотите удалить это место?", () => {
      setPlaces(places.filter((p) => p.id !== id));
      closeConfirm();
    });
  };

  const handleApprove = (id: number) => {
    setPlaces(
      places.map((p) =>
        p.id === id ? { ...p, status: "published" } : p
      )
    );
  };

  const handleReject = (id: number) => {
    openConfirm("Вы уверены, что хотите отклонить это место?", () => {
      setPlaces(
        places.map((p) =>
          p.id === id ? { ...p, status: "rejected" } : p
        )
      );
      closeConfirm();
    });
  };

  const handleSavePlace = (updatedPlace: Place) => {
    setPlaces(
      places.map((p) =>
        p.id === updatedPlace.id ? updatedPlace : p
      )
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedStatuses([]);
  };

  const toggleCategory = (cat: string) => {
    if (cat === "Все категории") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.length === 0) return [cat];
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const toggleStatus = (status: string) => {
    if (status === "Все статусы") {
      setSelectedStatuses([]);
      return;
    }
    setSelectedStatuses((prev) => {
      if (prev.length === 0) return [status];
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return "Категории";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `Категории (${selectedCategories.length})`;
  };

  const getStatusLabel = () => {
    if (selectedStatuses.length === 0) return "Статусы";
    if (selectedStatuses.length === 1) {
      const map: Record<string, string> = {
        published: "Опубликовано",
        moderation: "На модерации",
        rejected: "Отклонено",
      };
      return map[selectedStatuses[0]] || selectedStatuses[0];
    }
    return `Статусы (${selectedStatuses.length})`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление местами</h1>

        {/* Фильтры */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-10 px-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-3 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="5.75" fill="white" stroke="#B0B0B0" strokeWidth="1.5" />
                <line x1="11.2021" y1="11" x2="17" y2="16.7979" stroke="#B0B0B0" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-[180px] h-10 px-3 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{getCategoryLabel()}</span>
              <span>▼</span>
            </button>
            {isCategoryDropdownOpen && (
              <div className="absolute top-11 left-0 w-[180px] max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {["Все категории", ...categories].map((cat) => {
                  const isChecked = cat === "Все категории"
                    ? selectedCategories.length === 0
                    : selectedCategories.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="w-[180px] h-10 px-3 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{getStatusLabel()}</span>
              <span>▼</span>
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute top-11 left-0 w-[180px] max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {statuses.map((status) => {
                  const realValue = status === "Опубликовано" ? "published" : status === "На модерации" ? "moderation" : "rejected";
                  const isChecked = status === "Все статусы"
                    ? selectedStatuses.length === 0
                    : selectedStatuses.includes(realValue);
                  return (
                    <label key={status} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStatus(status === "Все статусы" ? "Все статусы" : realValue)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
          >
            Сбросить фильтры
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex gap-8 border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Все места ({places.length})
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "moderation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Предложенные ({places.filter((p) => p.status === "moderation").length})
          </button>
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">
                    Категория
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">
                    Адрес
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Нет мест, соответствующих фильтрам
                    </td>
                  </tr>
                ) : (
                  currentPlaces.map((place) => (
                    <PlaceRow
                      key={place.id}
                      place={place}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Показано {currentPlaces.length} из {filteredPlaces.length} записей
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      <EditPlaceModal
        place={editingPlace}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlace(null);
        }}
        onSave={handleSavePlace}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default ModeratorPage;