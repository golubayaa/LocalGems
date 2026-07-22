/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Map/AddPlaceModal.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { categories, categoryToEnumMap } from "../../data/categories";
import InputField from "../Form/InputField";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";
import { useSuggest } from "../../hooks/useSuggest";

declare global {
  interface Window {
    isSelectingCoords?: boolean;
    setSelectedCoords?: (lat: number, lng: number) => void;
    openAddPlaceModal?: () => void;
    showToast?: (message: string, type: "success" | "error") => void;
  }
}

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPlaceModal = ({ isOpen, onClose }: AddPlaceModalProps) => {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const { panelRef, handleTouchStart, handleTouchMove, handleTouchEnd, style } = useSwipeToClose({
    isOpen,
    onClose,
    threshold: 80,
  });

  const { items, isOpen: isSuggestOpen, setIsOpen: setIsSuggestOpen, fetchSuggest, clearSuggest, fetchAddressByCoords } = useSuggest();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

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

  const handleClose = useCallback(() => {
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
    clearSuggest();
    onClose();
  }, [clearSuggest, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSelecting && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSelecting, isSubmitting, handleClose]);

  useEffect(() => {
    window.setSelectedCoords = async (lat: number, lng: number) => {
      setFormData((prev) => ({
        ...prev,
        coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }));

      try {
        const address = await fetchAddressByCoords(lat, lng);
        if (address) {
          setFormData((prev) => ({
            ...prev,
            address: address,
          }));
        }
      } catch (error) {
        // ошибка обработана внутри хука, ничего не делаем
      }

      setIsSelecting(false);
      window.isSelectingCoords = false;
    };
    return () => {
      delete window.setSelectedCoords;
    };
  }, [fetchAddressByCoords]);

  if (!isOpen || isSelecting) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, address: value }));
    fetchSuggest(value);
  };

  const handleAddressSelect = (item: { value: string; coordinates?: [number, number] }) => {
    setFormData((prev) => ({ ...prev, address: item.value }));
    if (item.coordinates) {
      const [lat, lng] = item.coordinates;
      setFormData((prev) => ({ ...prev, coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
    }
    clearSuggest();
    addressInputRef.current?.blur();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        const maxSize = 10 * 1024 * 1024;

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
      fileInputRef.current.value = "";
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
      const payload = new FormData();
      const categoryEnumValue = categoryToEnumMap[formData.category] ?? 0;
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("category", categoryEnumValue.toString());
      payload.append("latitude", lat.toString());
      payload.append("longitude", lng.toString());

      if (formData.address.trim()) {
        payload.append("address", formData.address.trim());
      }

      uploadedFiles.forEach((file) => {
        payload.append("photos", file);
      });

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Ошибка при сохранении места");
      }

      window.showToast?.("Место успешно отправлено на модерацию!", "success");
      handleClose();
    } catch (error) {
      console.error("Ошибка отправки формы:", error);
      window.showToast?.(
        error instanceof Error ? error.message : "Произошла ошибка при загрузке",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOnMap = () => {
    window.isSelectingCoords = true;
    setIsSelecting(true);
  };

  // Десктопная версия
  if (!isMobile) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-[560px] max-h-[95vh] overflow-y-auto p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-2xl">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
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
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
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
                  className={`w-full h-9 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 ${
                    errors.address
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
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
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Координаты</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
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
                className={`w-full ${uploadedFiles.length === 0 ? 'h-[60px]' : 'min-h-[60px]'} border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition flex-wrap gap-2 p-2 ${
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
                <p className="text-xs text-gray-400 mt-1">Выбрано: {uploadedFiles.length} файлов</p>
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
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  }

  // Мобильная версия
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

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
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-t-2xl">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-700 font-medium">Загрузка фото и сохранение...</p>
          </div>
        )}

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Добавить место</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-0">
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
              className="h-11 text-base"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full h-11 px-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.category
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-orange-500"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">Выбери категорию</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
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
                  className={`w-full h-11 px-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 ${
                    errors.address
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
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
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Координаты</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="coordinates"
                  value={formData.coordinates}
                  onChange={handleChange}
                  placeholder="56.8389, 60.6057"
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={handleSelectOnMap}
                  disabled={isSubmitting}
                  className="h-11 px-4 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition whitespace-nowrap disabled:bg-gray-400"
                >
                  На карте
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                placeholder="Расскажи про место..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
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
                className={`w-full ${uploadedFiles.length === 0 ? 'h-[60px]' : 'min-h-[60px]'} border-2 border-dashed rounded-lg flex items-center justify-center text-sm transition flex-wrap gap-2 p-2 ${
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
                <p className="text-xs text-gray-400 mt-1">Выбрано: {uploadedFiles.length} файлов</p>
              )}
            </div>

            <div className="flex gap-4 pt-2 pb-4 mt-2 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 h-11 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
};

export default AddPlaceModal;