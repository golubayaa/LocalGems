/* eslint-disable react-hooks/set-state-in-effect */
// src/components/pages/ModeratorPage.tsx
import { useState, useMemo, useEffect } from "react";
import type { Place } from "../../data/mockPlaces";
import { categories } from "../../data/categories";
import PlaceRow from "../Moderator/PlaceRow";
import EditPlaceModal from "../Moderator/EditPlaceModal";
import ConfirmModal from "../Moderator/ConfirmModal";
import { placesApi } from "../../api/places";
import { moderationApi } from "../../api/moderation";
import { mapCategoryCodeToLabel } from "../../api/places";

const statuses = ["Все статусы", "Опубликовано", "На модерации"];

const normalizeModerationPlaces = (payload: unknown): Place[] => {
  const extractItems = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
      return value;
    }

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
      const arrayCandidate = candidates.find((candidate): candidate is unknown[] => Array.isArray(candidate));
      return arrayCandidate ?? [];
    }

    return [];
  };

  const items = Array.isArray(payload) ? payload : extractItems(payload);

  return items
    .map((item): Place | null => {  // ⬅️ Явно указываем возвращаемый тип
      const record = item as Record<string, unknown>;
      const latitude = Number(record.latitude ?? record.lat ?? 56.8389);
      const longitude = Number(record.longitude ?? record.lng ?? 60.6057);
      const rawId = record.id ?? record.placeId ?? record.suggestionId;
      const id = rawId !== undefined ? String(rawId) : null;

      if (!id) {
        console.warn("⚠️ Пропуск элемента без id:", record);
        return null;
      }

      const categoryLabel = mapCategoryCodeToLabel(record.category);

      // ⬅️ Явно приводим к типу Place
      return {
        id: id as string | number,  // Приводим к совместимому типу
        name: String(record.name ?? record.title ?? record.placeName ?? "Без названия"),
        category: categoryLabel,
        address: String(record.address ?? record.location ?? "Адрес не указан"),
        status: "moderation" as const,
        rating: record.rating ? Number(record.rating) : undefined,
        lat: Number.isFinite(latitude) ? latitude : 56.8389,
        lng: Number.isFinite(longitude) ? longitude : 60.6057,
        description: typeof record.description === "string" ? record.description : undefined,
      } as Place;  // ⬅️ Type assertion
    })
    .filter((p): p is Place => p !== null);  // ⬅️ Теперь type predicate работает корректно
};

const ITEMS_PER_PAGE = 20;

const ModeratorPage = () => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [moderationPlaces, setModerationPlaces] = useState<Place[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "moderation">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // ⬇️ ИЗМЕНЕНО: onConfirm теперь может быть async
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  const [currentPage, setCurrentPage] = useState(1);

  // ⬇️ НОВОЕ: ID места, которое сейчас обрабатывается (approve/reject)
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      if (activeTab !== "all") return;
      try {
        const remotePlaces = await placesApi.listPage(currentPage, ITEMS_PER_PAGE);
        setAllPlaces(remotePlaces);
        setPlaces(remotePlaces);
        setHasNextPage(remotePlaces.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Failed to load moderator places", error);
      }
    };
    loadPlaces();
  }, [activeTab, currentPage]);

  useEffect(() => {
    if (activeTab !== "moderation") return;
    const loadModerationQueue = async () => {
      try {
        const queuePayload = await moderationApi.listQueue(currentPage, ITEMS_PER_PAGE);
        const nextPlaces = normalizeModerationPlaces(queuePayload);
        setModerationPlaces(nextPlaces);
        setPlaces(nextPlaces);
        setHasNextPage(nextPlaces.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Failed to load moderation queue", error);
      }
    };
    loadModerationQueue();
  }, [activeTab, currentPage]);

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

  const currentPlaces = filteredPlaces;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategories, selectedStatuses, activeTab]);

  // ⬇️ ИЗМЕНЕНО: openConfirm принимает async-коллбэк
  const openConfirm = (message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, message: "", onConfirm: () => {} });
  };

  const handleEdit = (id: number | string) => {
    const place = places.find((p) => p.id === id);
    if (place) {
      setEditingPlace(place);
      setIsModalOpen(true);
    }
  };

  // ⬇️ ГЛАВНОЕ ИЗМЕНЕНИЕ: handleDelete теперь отправляет запрос на бэкенд
  const handleDelete = (id: number | string) => {
    const stringId = String(id);

    // Защита от двойного клика
    if (processingId === stringId) return;

    openConfirm("Вы уверены, что хотите отклонить это предложение?", async () => {
      try {
        setProcessingId(stringId);
        console.log("🔵 Отправка запроса на отклонение, ID:", stringId);

        // ⚠️ Сначала запрос на сервер (POST /api/moderation/suggestions/{id}/reject)
        await moderationApi.rejectSuggestion(stringId, "Отклонено модератором");

        console.log("🟢 Отклонение успешно");

        // ✅ Только после успешного ответа обновляем UI
        setPlaces((prev) => prev.filter((p) => p.id !== stringId));
        setAllPlaces((prev) => prev.filter((p) => p.id !== stringId));
        setModerationPlaces((prev) => prev.filter((p) => p.id !== stringId));

        closeConfirm();
      } catch (error: any) {
        console.error("🔴 Ошибка отклонения:", error);

        let message = "Не удалось отклонить предложение. Попробуйте позже.";
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          console.log("Статус ответа:", status);
          console.log("Данные ошибки:", data);

          if (data?.message) {
            message = data.message;
          } else if (status === 401) {
            message = "Сессия истекла. Войдите заново.";
          } else if (status === 404) {
            message = "Предложение не найдено. Возможно, оно уже обработано.";
          } else if (status === 400) {
            message = "Неверный запрос. Проверьте данные.";
          } else if (status === 403) {
            message = "Недостаточно прав для этого действия.";
          }
        } else if (error.request) {
          message = "Сервер не отвечает. Проверьте соединение.";
        }

        // ❌ При ошибке НЕ закрываем модалку, чтобы пользователь мог повторить
        alert(message);
      } finally {
        setProcessingId(null);
      }
    });
  };

  // ⬇️ ИЗМЕНЕНО: используем moderationApi вместо placesApi для правильного URL
  const handleApprove = async (id: number | string) => {
    const stringId = String(id);

    // Защита от двойного клика
    if (processingId === stringId) return;

    try {
      setProcessingId(stringId);
      console.log("🔵 Отправка запроса на утверждение, ID:", stringId);

      // ⚠️ POST /api/moderation/suggestions/{id}/approve
      await moderationApi.approveSuggestion(stringId);

      console.log("🟢 Утверждение успешно");

      setPlaces((prev) => prev.filter((p) => p.id !== stringId));
      setAllPlaces((prev) => prev.filter((p) => p.id !== stringId));
      setModerationPlaces((prev) => prev.filter((p) => p.id !== stringId));
    } catch (error: any) {
      console.error("🔴 Ошибка утверждения:", error);

      let message = "Не удалось утвердить место. Попробуйте позже.";
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        console.log("Статус ответа:", status);
        console.log("Данные ошибки:", data);

        if (data?.message) {
          message = data.message;
        } else if (status === 401) {
          message = "Сессия истекла. Войдите заново.";
        } else if (status === 404) {
          message = "Место не найдено. Возможно, оно уже обработано.";
        } else if (status === 400) {
          message = "Неверный запрос. Проверьте данные.";
        } else if (status === 403) {
          message = "Недостаточно прав для этого действия.";
        }
      } else if (error.request) {
        message = "Сервер не отвечает. Проверьте соединение.";
      }

      alert(message);
    } finally {
      setProcessingId(null);
    }
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
    const realValue = status === "Опубликовано" ? "published" : "moderation";
    setSelectedStatuses((prev) => {
      if (prev.length === 0) return [realValue];
      if (prev.includes(realValue)) {
        return prev.filter((s) => s !== realValue);
      } else {
        return [...prev, realValue];
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
                  const realValue = status === "Опубликовано" ? "published" : "moderation";
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
            Все места ({allPlaces.length})
          </button>
          <button
            onClick={() => setActiveTab("moderation")}
            className={`pb-2 text-sm font-medium transition ${
              activeTab === "moderation"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Предложенные ({moderationPlaces.length})
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
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Пагинация */}
        {(currentPage > 1 || hasNextPage) && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Показано {currentPlaces.length} записей
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
                Страница {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
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