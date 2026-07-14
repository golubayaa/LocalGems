// src/components/Auth/RegisterModal.tsx
import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import InputField from "../Form/InputField";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const register = useStore((state) => state.register);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setGeneralError("");
  };

  const validate = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const newErrors = { email: "", password: "" };
    if (!email.trim()) {
      newErrors.email = "Введите почту";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Введите корректный адрес почты (например, user@domain.com)";
    }
    if (!password.trim()) {
      newErrors.password = "Введите пароль";
    } else if (password.length < 6) {
      newErrors.password = "Пароль должен быть не менее 6 символов";
    }
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register(email, password);
      onClose();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[400px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <h2 className="text-xl font-bold text-gray-900">Регистрация</h2>
          <button
            onClick={onClose}
            className="absolute right-0 top-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <InputField
            label="Почта"
            name="email"
            type="email"
            value={email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="Введите почту"
          />

          <InputField
            label="Пароль"
            name="password"
            type="password"
            value={password}
            onChange={handleChange}
            error={errors.password}
            required
            placeholder="Введите пароль"
          />

          {generalError && (
            <p className="text-sm text-red-500 text-center">{generalError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Уже есть аккаунт?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:underline"
            >
              Войти
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;