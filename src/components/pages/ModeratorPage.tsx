/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo, useEffect } from "react";
import type { Place } from "../../data/mockPlaces";
import { categories } from "../../data/categories";
import PlaceRow from "../Moderator/PlaceRow";
import MobilePlaceCard from "../Moderator/MobilePlaceCard";
import EditPlaceModal from "../Moderator/EditPlaceModal";
import ConfirmModal from "../Moderator/ConfirmModal";
import { placesApi } from "../../api/places";
import { moderationApi } from "../../api/moderation";
import { mapCategoryCodeToLabel } from "../../api/places";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useStore } from "../../store/useStore";

const ITEMS_PER_PAGE = 10;

const statusOptions = [
  { value: "published", label: "Опубликовано" },
  { value: "moderation", label: "На модерации" },
];

const normalizeModerationPlaces = (payload: unknown): Place[] => {
  const extractItems = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const candidates = [
        record.pendingSuggestions,
        record.items,
        record.places,
        record.data,
        record.results,
        record.content,
      ];
      const found = candidates.find((c): c is unknown[] => Array.isArray(c));
      return found ?? [];
    }
    return [];
  };

  const items = Array.isArray(payload) ? payload : extractItems(payload);

  return items
    .map((item): Place | null => {
      const record = item as Record<string, unknown>;
      const rawId = record.id ?? record.placeId ?? record.suggestionId;
      const id = rawId !== undefined ? String(rawId) : null;
      if (!id) return null;

      const latitude = Number(record.latitude ?? record.lat ?? 56.8389);
      const longitude = Number(record.longitude ?? record.lng ?? 60.6057);

      return {
        id,
        name: String(record.name ?? record.title ?? record.placeName ?? "Без названия"),
        category: mapCategoryCodeToLabel(record.category),
        address: String(record.address ?? record.location ?? "Адрес не указан"),
        status: "moderation" as const,
        rating: record.rating ? Number(record.rating) : undefined,
        lat: Number.isFinite(latitude) ? latitude : 56.8389,
        lng: Number.isFinite(longitude) ? longitude : 60.6057,
        description: typeof record.description === "string" ? record.description : undefined,
      } as Place;
    })
    .filter((p): p is Place => p !== null);
};

const ModeratorPage = () => {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const setPlaces = useStore((state) => state.setPlaces);

  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [moderationPlaces, setModerationPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["published", "moderation"]);
  const [activeTab, setActiveTab] = useState<"all" | "moderation">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [published, moderation] = await Promise.all([
        placesApi.list({ size: 10000 }),
        moderationApi.listQueue(1, 10000),
      ]);
      const normalizedModeration = normalizeModerationPlaces(moderation);
      const combined = [...published, ...normalizedModeration];
      setAllPlaces(combined);
      setModerationPlaces(normalizedModeration);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to load all data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const refreshData = async () => {
    await loadAllData();
  };

  const filteredPlaces = useMemo(() => {
    let filtered = allPlaces;
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
    return filtered;
  }, [allPlaces, search, selectedCategories, selectedStatuses]);

  const displayPlaces = useMemo(() => {
    if (activeTab === "moderation") {
      return filteredPlaces.filter((p) => p.status === "moderation");
    }
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredPlaces.slice(start, end);
  }, [activeTab, filteredPlaces, currentPage]);

  const totalAll = filteredPlaces.length;
  const totalModeration = filteredPlaces.filter((p) => p.status === "moderation").length;
  const totalPages = Math.ceil(totalAll / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategories, selectedStatuses, activeTab]);

  const openConfirm = (message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
  };

  const handleEdit = (id: string) => {
    const place = allPlaces.find((p) => String(p.id) === id);
    if (place) {
      setEditingPlace(place);
      setIsModalOpen(true);
    }
  };

  // Универсальное удаление: для модерации — отклонение, для опубликованных — удаление
  const handleDelete = (id: string) => {
    if (processingId === id) return;
    const place = allPlaces.find((p) => String(p.id) === id);
    if (!place) return;

    const isModeration = place.status === "moderation";
    const confirmMessage = isModeration
      ? "Вы уверены, что хотите отклонить это предложение?"
      : "Вы уверены, что хотите удалить это место?";

    openConfirm(confirmMessage, async () => {
      try {
        setProcessingId(id);
        if (isModeration) {
          await moderationApi.rejectSuggestion(id, "Отклонено модератором");
        } else {
          await placesApi.deletePlace(id);
        }
        await refreshData();
        closeConfirm();
      } catch (error) {
        const message = isModeration
          ? "Не удалось отклонить предложение. Попробуйте позже."
          : "Не удалось удалить место. Попробуйте позже.";
        alert(message);
        console.error("Delete error:", error);
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleApprove = async (id: string) => {
    if (processingId === id) return;
    try {
      setProcessingId(id);
      await moderationApi.approveSuggestion(id);
      await refreshData();
    } catch (error) {
      alert("Не удалось утвердить место. Попробуйте позже.");
      console.error("Approve error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSavePlace = (updatedPlace: Place) => {
    const updatedAll = allPlaces.map((p) =>
      String(p.id) === String(updatedPlace.id) ? updatedPlace : p
    );
    setAllPlaces(updatedAll);
    const updatedModeration = moderationPlaces.map((p) =>
      String(p.id) === String(updatedPlace.id) ? updatedPlace : p
    );
    setModerationPlaces(updatedModeration);
    setPlaces(updatedAll);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedStatuses(["published", "moderation"]);
  };

  const toggleCategory = (cat: string) => {
    if (cat === "Все категории") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      return [...prev, cat];
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status];
      if (next.length === 0) return ["published", "moderation"];
      return next;
    });
  };

  const getStatusLabel = () => {
    if (selectedStatuses.length === 2) return "Статусы";
    if (selectedStatuses.length === 1) {
      const found = statusOptions.find((opt) => opt.value === selectedStatuses[0]);
      return found ? found.label : "Статусы";
    }
    return "Статусы";
  };

  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return "Категории";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `Категории (${selectedCategories.length})`;
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление местами</h1>

        {/* Фильтры */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-3 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="5.75" fill="white" stroke="#B0B0B0" strokeWidth="1.5" />
                <line x1="11.2021" y1="11" x2="17" y2="16.7979" stroke="#B0B0B0" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-4 md:flex-nowrap">
            <div className="relative flex-1 min-w-[140px] md:w-[180px] md:flex-none">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="truncate">{getCategoryLabel()}</span>
                <span>▼</span>
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute top-11 left-0 w-full md:w-[180px] max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {["Все категории", ...categories].map((cat) => {
                    const isChecked = cat === "Все категории" ? selectedCategories.length === 0 : selectedCategories.includes(cat);
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

            <div className="relative flex-1 min-w-[140px] md:w-[180px] md:flex-none">
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="truncate">{getStatusLabel()}</span>
                <span>▼</span>
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute top-11 left-0 w-full md:w-[180px] max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {statusOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(opt.value)}
                        onChange={() => toggleStatus(opt.value)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition whitespace-nowrap"
            >
              Сбросить фильтры
            </button>
          </div>
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
            Все места ({totalAll})
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "moderation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Предложенные ({totalModeration})
          </button>
        </div>

        {/* Список мест */}
        {isMobile ? (
          <div className="flex flex-col gap-3">
            {displayPlaces.length === 0 ? (
              <div className="text-center text-gray-400 py-10">Нет мест</div>
            ) : (
              displayPlaces.map((place) => (
                <MobilePlaceCard
                  key={place.id}
                  place={place}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  isProcessing={processingId === String(place.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">Название</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">Категория</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">Адрес</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#1E1E1E] uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayPlaces.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет мест</td></tr>
                  ) : (
                    displayPlaces.map((place) => (
                      <PlaceRow
                        key={place.id}
                        place={place}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onApprove={handleApprove}
                        isProcessing={processingId === String(place.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Пагинация */}
        {activeTab === "all" && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">Показано {displayPlaces.length} из {totalAll}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="px-3 py-1 text-sm font-medium">Страница {currentPage}</span>
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
        onClose={() => { setIsModalOpen(false); setEditingPlace(null); }}
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