// src/components/ModeratorHeader/ModeratorHeader.tsx
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";

const ModeratorHeader = () => {
  const navigate = useNavigate();
  const { userEmail, logout } = useStore();

  return (
    <header className="h-16 bg-gray-800 text-white px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
          LocalGems
        </span>
        <span className="text-sm text-gray-400 ml-2">| ЛК модератора</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">{userEmail}</span>
        <button
          className="text-sm font-medium text-red-400 hover:text-red-300 transition"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Выйти
        </button>
      </div>
    </header>
  );
};

export default ModeratorHeader;