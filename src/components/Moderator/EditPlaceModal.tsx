/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Moderator/EditPlaceModal.tsx
import { useState, useEffect, useRef } from "react";
import type { Place } from "../../data/mockPlaces";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";
import { useSuggest } from "../../hooks/useSuggest";

interface EditPlaceModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlace: Place) => void;
}

const EditPlaceModal = ({ place, isOpen, onClose, onSave }: EditPlaceModalProps) => {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [formData, setFormData] = useState<Place | null>(place);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { items, isOpen: isSuggestOpen, setIsOpen: setIsSuggestOpen, fetchSuggest, clearSuggest } = useSuggest();

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

  useEffect(() => {
    setFormData(place);
    setUploadedFiles([]);
  }, [place]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !place || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, address: value };
    });
    fetchSuggest(value);
  };

  const handleAddressSelect = (item: { value: string; coordinates?: [number, number] }) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, address: item.value };
      if (item.coordinates) {
        const [lat, lng] = item.coordinates;
        updated.lat = lat;
        updated.lng = lng;
      }
      return updated;
    });
    clearSuggest();
    addressInputRef.current?.blur();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const openMapInNewTab = () => {
    if (formData) {
      const url = `https://yandex.ru/maps/?pt=${formData.lng},${formData.lat}&z=16&l=map`;
      window.open(url, "_blank");
    }
  };

  // Десктопная версия
  if (!isMobile) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-[560px] max-h-[95vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Редактирование места</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Кафе">Кафе</option>
                <option value="Рестораны">Рестораны</option>
                <option value="Архитектура">Архитектура</option>
                <option value="Парки">Парки</option>
                <option value="Музеи">Музеи</option>
                <option value="Стрит-арт">Стрит-арт</option>
                <option value="Бары">Бары</option>
                <option value="Коворкинги">Коворкинги</option>
                <option value="Магазины">Магазины</option>
                <option value="Ярмарки">Ярмарки</option>
                <option value="Нишевые места">Нишевые места</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес *</label>
              <div className="relative">
                <input
                  type="text"
                  ref={addressInputRef}
                  value={formData.address}
                  onChange={handleAddressChange}
                  onFocus={() => setIsSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setIsSuggestOpen(false), 300)}
                  placeholder="Введите адрес"
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {isSuggestOpen && items.length > 0 && (
                  <ul className="absolute top-full left-0 w-full z-20 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {items.map((item, idx) => (
                      <li
                        key={idx}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
                        onMouseDown={() => handleAddressSelect(item)}
                      >
                        {item.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Координаты</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${formData.lat}, ${formData.lng}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(",").map((s) => s.trim());
                    if (parts.length === 2) {
                      const lat = parseFloat(parts[0]);
                      const lng = parseFloat(parts[1]);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setFormData({ ...formData, lat, lng });
                      }
                    }
                  }}
                  className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="56.8389, 60.6057"
                />
                <button
                  type="button"
                  onClick={openMapInNewTab}
                  className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                >
                  Показать на карте
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Введите описание места..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
                >
                  +
                </button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 h-10 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Мобильная версия
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={panelRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col will-change-transform"
        style={{
          top: "40px",
          bottom: "0",
          height: "auto",
          maxHeight: "calc(100vh - 40px)",
          ...style,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Редактирование места</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-0">
          <form className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Кафе">Кафе</option>
                <option value="Рестораны">Рестораны</option>
                <option value="Архитектура">Архитектура</option>
                <option value="Парки">Парки</option>
                <option value="Музеи">Музеи</option>
                <option value="Стрит-арт">Стрит-арт</option>
                <option value="Бары">Бары</option>
                <option value="Коворкинги">Коворкинги</option>
                <option value="Магазины">Магазины</option>
                <option value="Ярмарки">Ярмарки</option>
                <option value="Нишевые места">Нишевые места</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес *</label>
              <div className="relative">
                <input
                  type="text"
                  ref={addressInputRef}
                  value={formData.address}
                  onChange={handleAddressChange}
                  onFocus={() => setIsSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setIsSuggestOpen(false), 300)}
                  placeholder="Введите адрес"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {isSuggestOpen && items.length > 0 && (
                  <ul className="absolute top-full left-0 w-full z-20 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {items.map((item, idx) => (
                      <li
                        key={idx}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
                        onMouseDown={() => handleAddressSelect(item)}
                      >
                        {item.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Координаты</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${formData.lat}, ${formData.lng}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(",").map((s) => s.trim());
                    if (parts.length === 2) {
                      const lat = parseFloat(parts[0]);
                      const lng = parseFloat(parts[1]);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setFormData({ ...formData, lat, lng });
                      }
                    }
                  }}
                  className="flex-1 h-11 px-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="56.8389, 60.6057"
                />
                <button
                  type="button"
                  onClick={openMapInNewTab}
                  className="h-11 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                >
                  На карте
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите описание места..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
                >
                  +
                </button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2 pb-4 mt-2 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 h-11 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPlaceModal;