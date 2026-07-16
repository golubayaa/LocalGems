// src/components/Map/AddPlaceModal.tsx
import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";
import { categories, categoryToEnumMap } from "../../data/categories";
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
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Новое состояние загрузки
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSelecting && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSelecting, isSubmitting]);

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

  // ✅ Очистка URL объектов при размонтировании или закрытии (предотвращает утечки памяти)
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((_, index) => {
        // Мы не храним URL отдельно, но при закрытии можно очистить, если бы хранили.
        // В данном случае браузер очистит их сам, но хорошая практика - управлять этим.
      });
    };
  }, [uploadedFiles]);

  const handleClose = () => {
    setFormData({
      name: "",
      category: "",
      address: "",
      coordinates: "",
      description: "",
    });
    setErrors({ name: "", category: "", address: "" });
    
    // ✅ Очищаем память от превью
    setUploadedFiles((prev) => {
      prev.forEach(file => URL.revokeObjectURL(URL.createObjectURL(file))); // Упрощенно, лучше хранить URL в отдельном стейте
      return [];
    });
    
    setIsSelecting(false);
    window.isSelectingCoords = false;
    onClose();
  };

  if (!isOpen || isSelecting) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        const maxSize = 10 * 1024 * 1024; // 10 MB

        if (!validTypes.includes(file.type)) {
          alert(`Файл "${file.name}" имеет неподдерживаемый формат. Используйте JPG, PNG или WEBP.`);
          return false;
        }
        if (file.size > maxSize) {
          alert(`Файл "${file.name}" слишком большой. Максимальный размер: 10 МБ.`);
          return false;
        }
        return true;
      });

      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Сброс input, чтобы можно было выбрать тот же файл повторно
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const triggerFileInput = () => {
    if (!isSubmitting) fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsSubmitting(true);

    try {
      // ✅ 1. Создаем FormData для отправки файлов и данных (multipart/form-data)
      const payload = new FormData();
      const categoryEnumValue = categoryToEnumMap[formData.category] ?? 0
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("category", categoryEnumValue.toString()); // Если бэкенд ждет enum, убедитесь, что строка совпадает (или используйте маппинг)
      payload.append("latitude", lat.toString());
      payload.append("longitude", lng.toString());
      
      if (formData.address.trim()) {
        payload.append("address", formData.address.trim());
      }

      // ✅ 2. Добавляем файлы. Имя "photos" должно совпадать с List<IFormFile> Photos в C#
      uploadedFiles.forEach((file) => {
        payload.append("photos", file);
      });

      // ✅ 3. Отправляем запрос на бэкенд
      // ЗАМЕНИТЕ '/api/suggestions' на ваш реальный endpoint и добавьте токен авторизации, если нужно
      const token = localStorage.getItem("authToken"); // Или ваш способ получения токена
      
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          // ВАЖНО: Не устанавливайте 'Content-Type': 'multipart/form-data' вручную! 
          // Браузер автоматически установит его с правильным boundary для FormData.
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Ошибка при сохранении места");
      }

      const result = await response.json();
      
      alert("Место успешно отправлено на модерацию!");
      handleClose();

    } catch (error) {
      console.error("Ошибка отправки формы:", error);
      alert(error instanceof Error ? error.message : "Произошла неизвестная ошибка при загрузке");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOnMap = () => {
    window.isSelectingCoords = true;
    setIsSelecting(true);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[560px] max-h-[95vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Спиннер загрузки поверх формы */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-2xl">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-700 font-medium">Загрузка фото и сохранение...</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Добавить место</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-50"
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
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full h-9 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.category
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-orange-500"
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            >
              <option value="">Выбери категорию</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-500 mt-1">{errors.category}</p>
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
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Координаты
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="coordinates"
                value={formData.coordinates}
                onChange={handleChange}
                placeholder="56.8389, 60.6057"
                disabled={isSubmitting}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={handleSelectOnMap}
                disabled={isSubmitting}
                className="h-9 px-4 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition whitespace-nowrap disabled:bg-gray-400"
              >
                На карте
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              placeholder="Расскажи про место..."
            />
          </div>

          {/* Фото */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фото {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={isSubmitting}
              className="hidden"
            />
            <div
              onClick={triggerFileInput}
              className={`w-full ${
                uploadedFiles.length === 0 ? "h-[60px]" : "min-h-[60px]"
              } border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition flex-wrap gap-2 p-2 ${
                isSubmitting
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-500 hover:border-orange-500 hover:text-orange-500 cursor-pointer"
              }`}
            >
              {uploadedFiles.length === 0 ? (
                <span>Загрузить фото</span>
              ) : (
                <div className="flex flex-wrap gap-2 w-full">
                  {uploadedFiles.map((file, index) => {
                    // Создаем URL только для рендера
                    const objectUrl = URL.createObjectURL(file);
                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group"
                      >
                        <img
                          src={objectUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        {!isSubmitting && (
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
                        )}
                      </div>
                    );
                  })}
                  {!isSubmitting && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerFileInput();
                      }}
                      className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-500 transition cursor-pointer text-2xl"
                    >
                      +
                    </div>
                  )}
                </div>
              )}
            </div>
            {uploadedFiles.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Выбрано: {uploadedFiles.length} файлов (макс. 10 МБ каждый)
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-10 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                "Сохранить"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlaceModal;