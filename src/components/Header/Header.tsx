// src/components/Header/Header.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import LoginModal from "../Auth/LoginModal";
import RegisterModal from "../Auth/RegisterModal";
import ConfirmModal from "../Moderator/ConfirmModal";

declare global {
  interface Window {
    openAddPlaceModal?: () => void;
    openFavoritesPanel?: () => void;
    openRoutePanel?: () => void;
    toggleMobileMenu?: () => void;
  }
}

const Header = () => {
  const navigate = useNavigate();
  const { isAuth, isModerator, userEmail, logout } = useStore();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleAddPlace = () => {
    if (window.openAddPlaceModal) {
      window.openAddPlaceModal();
    }
  };

  const handleOpenFavorites = () => {
    if (window.openFavoritesPanel) {
      window.openFavoritesPanel();
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/");
    setShowLogoutConfirm(false);
  };

  const toggleMobileMenu = () => {
    if (window.toggleMobileMenu) {
      window.toggleMobileMenu();
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 flex items-center justify-between relative z-50">
        {/* Бургер слева (только на мобилке) */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5 focus:outline-none"
          aria-label="Меню"
        >
          <span className="block w-6 h-0.5 bg-gray-800" />
          <span className="block w-6 h-0.5 bg-gray-800" />
          <span className="block w-6 h-0.5 bg-gray-800" />
        </button>

        {/* Логотип по центру на мобилке, слева на десктопе */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-start">
          <span
            className="text-xl sm:text-2xl font-bold text-blue-600 cursor-pointer"
            onClick={() => navigate("/")}
          >
            LocalGems
          </span>
        </div>

        {/* Десктопные кнопки */}
        <div className="hidden md:flex items-center gap-4">
          {isAuth && !isModerator && (
            <>
              <button
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
                onClick={handleAddPlace}
              >
                Добавить место
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                onClick={handleOpenFavorites}
              >
                Избранное
              </button>
            </>
          )}

          {isAuth ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{userEmail}</span>
              <span className="text-gray-300">|</span>
              <button
                className="text-sm font-medium text-red-500 hover:text-red-700 transition"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              onClick={() => setIsLoginOpen(true)}
            >
              Войти
            </button>
          )}
        </div>

        {/* Справа на мобилке: кнопка Войти/Выйти или почта (коротко) */}
        <div className="md:hidden flex items-center gap-2">
          {isAuth ? (
            <>
              <span className="text-sm text-gray-700 truncate max-w-[100px]">{userEmail}</span>
              <button
                className="text-sm font-medium text-red-500 hover:text-red-700 transition"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
              onClick={() => setIsLoginOpen(true)}
            >
              Войти
            </button>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        message="Вы уверены, что хотите выйти?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Header;