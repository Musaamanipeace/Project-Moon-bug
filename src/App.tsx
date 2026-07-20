import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import StarryBackground from "./components/StarryBackground";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Profile from "./pages/Profile";
import Notebook from "./pages/Notebook";
import Events from "./pages/Events";
import Ads from "./pages/Ads";
import AdDetail from "./pages/AdDetail";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-moon-dim">
        <span className="animate-pulse font-display tracking-wide">summoning the moon…</span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { loading } = useAuth();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <StarryBackground />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-6 sm:px-8">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center text-moon-dim">
            <span className="animate-pulse font-display">summoning the moon…</span>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/challenges"
              element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/challenges/:slug"
              element={
                <ProtectedRoute>
                  <ChallengeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notebook"
              element={
                <ProtectedRoute>
                  <Notebook />
                </ProtectedRoute>
              }
            />
            <Route path="/events" element={<Events />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/ads/:id" element={<AdDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
