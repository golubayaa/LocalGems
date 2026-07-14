// src/components/Map/AddPlaceModal.tsx
import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { categories } from "../../data/categories";
import InputField from "../Form/InputField";

declare global {
  interface Window {
    isSelectingCoords?: boolean;
    setSelectedCoords?: (lat: number, lng: number) => void;
    openAddPlaceModal?: () => void;
  }
}

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPlaceModal = ({ isOpen, onClose }: AddPlaceModalProps) => {
  const addPlace = useStore((state) => state.addPlace);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    address: "",
    coordinates: "",
    description: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    category: "",
    address: "",
  });

  const [isSelecting, setIsSelecting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSelecting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSelecting, onClose]);

  // Регистрация глобальной функции для получения координат с карты
  useEffect(() => {
    window.setSelectedCoords = (lat: number, lng: number) => {
      setFormData((prev) => ({
        ...prev,
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }));
      setIsSelecting(false);
      window.isSelectingCoords = false;
    };
    return () => {
      delete window.setSelectedCoords;
    };
  }, []);

  // Функция закрытия с полным сбросом формы
  const handleClose = () => {
    setFormData({
      name: "",
      category: "",
      address: "",
      coordinates: "",
      description: "",
    });
    setErrors({ name: "", category: "", address: "" });
    setUploadedFiles([]);
    setIsSelecting(false);
    window.isSelectingCoords = false;
    onClose();
  };

  if (!isOpen || isSelecting) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Сброс ошибки для поля при изменении
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    const newErrors = {
      name: formData.name.trim() ? "" : "Пожалуйста, заполните название",
      category: formData.category ? "" : "Пожалуйста, выберите категорию",
      address: formData.address.trim() ? "" : "Пожалуйста, заполните адрес",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== "")) {
      return;
    }

    let lat = 56.8389;
    let lng = 60.6057;
    if (formData.coordinates.trim()) {
      const parts = formData.coordinates.split(",").map((s) => s.trim());
      if (parts.length === 2) {
        const parsedLat = parseFloat(parts[0]);
        const parsedLng = parseFloat(parts[1]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          lat = parsedLat;
          lng = parsedLng;
        }
      }
    }

    // Теперь объект соответствует интерфейсу Place (после добавления description в интерфейс)
    const newPlace = {
      name: formData.name.trim(),
      category: formData.category,
      address: formData.address.trim(),
      lat,
      lng,
      description: formData.description.trim(),
      status: "moderation" as const,
    };

    addPlace(newPlace);
    // Здесь можно добавить логику загрузки фото на сервер
    // if (uploadedFiles.length > 0) { ... }
    handleClose(); // закрываем и сбрасываем
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
          <h2 className="text-xl font-bold text-gray-900">Добавить место</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <InputField
            label="Название"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full h-9 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            >
              <option value="">Выбери категорию</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <InputField
            label="Адрес"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Координаты</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="coordinates"
                value={formData.coordinates}
                onChange={handleChange}
                placeholder="56.8389, 60.6057"
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSelectOnMap}
                className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                Выбрать на карте
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Расскажи про место..."
            />
          </div>

          {/* Фото */}
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
                <span>Загрузить фото</span>
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
              onClick={handleClose}
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

export default AddPlaceModal;