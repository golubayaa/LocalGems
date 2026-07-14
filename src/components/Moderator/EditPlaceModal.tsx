/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Moderator/EditPlaceModal.tsx
import { useState, useEffect, useRef } from "react";
import type { Place } from "../../data/mockPlaces";

declare global {
  interface Window {
    isSelectingCoords?: boolean;
    setSelectedCoords?: (lat: number, lng: number) => void;
  }
}

interface EditPlaceModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlace: Place) => void;
}

const EditPlaceModal = ({ place, isOpen, onClose, onSave }: EditPlaceModalProps) => {
  const [formData, setFormData] = useState<Place | null>(place);
  const [isSelecting, setIsSelecting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(place);
    // При открытии сбрасываем загруженные фото (они не относятся к существующему месту)
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

  useEffect(() => {
    window.setSelectedCoords = (lat: number, lng: number) => {
      setFormData((prev) => {
        if (!prev) return prev;
        return { ...prev, lat, lng };
      });
      setIsSelecting(false);
      window.isSelectingCoords = false;
    };
    return () => {
      delete window.setSelectedCoords;
    };
  }, []);

  if (!isOpen || !place || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      // Здесь можно добавить загрузку фото на сервер
      // if (uploadedFiles.length > 0) { ... }
      onClose();
    }
  };

  const handleSelectOnMap = () => {
    window.isSelectingCoords = true;
    setIsSelecting(true);
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
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Координаты</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${formData.lat}, ${formData.lng}`}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled
              />
              <button
                type="button"
                onClick={handleSelectOnMap}
                className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                {isSelecting ? "Выбираем..." : "Выбрать на карте"}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите описание места..."
            />
          </div>

          {/* Фото с загрузкой */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={triggerFileInput}
              className={`w-full ${uploadedFiles.length === 0 ? 'h-[60px]' : 'min-h-[60px]'} border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition cursor-pointer flex-wrap gap-2 p-2`}
            >
              {uploadedFiles.length === 0 ? (
                <span>Добавить фото</span>
              ) : (
                <div className="flex flex-wrap gap-2 w-full">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileInput();
                    }}
                    className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition cursor-pointer text-2xl"
                  >
                    +
                  </div>
                </div>
              )}
            </div>
            {uploadedFiles.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">Выбрано: {uploadedFiles.length} файлов</p>
            )}
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
};

export default EditPlaceModal;