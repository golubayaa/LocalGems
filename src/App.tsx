// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/Header/Header";
import ModeratorHeader from "./components/ModeratorHeader/ModeratorHeader";
import HomePage from "./components/pages/HomePage";
import ModeratorPage from "./components/pages/ModeratorPage";
import { useStore } from "./store/useStore";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isModeratorRoute = location.pathname.startsWith("/moderator");

  return (
    <div className="min-h-screen flex flex-col">
      {isModeratorRoute ? <ModeratorHeader /> : <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
};

const ProtectedRoute = ({
  children,
  requireModerator = false,
}: {
  children: React.ReactNode;
  requireModerator?: boolean;
}) => {
  const { isAuth, isModerator } = useStore();

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (requireModerator && !isModerator) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { isModerator } = useStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              {isModerator ? <Navigate to="/moderator" replace /> : <HomePage />}
            </AppLayout>
          }
        />
        <Route
          path="/moderator"
          element={
            <AppLayout>
              <ProtectedRoute requireModerator>
                <ModeratorPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;