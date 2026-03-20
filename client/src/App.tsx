import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import BoardRoom from './pages/BoardRoom';
import { getStoredToken, getStoredUser } from './api/auth';
import type { AppUser } from './types';

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getStoredToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser({ ...stored, token, role: 'User' });
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route — shows Login, redirects if already logged in */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/" replace />
              : <Login onSuccess={(u) => setUser({ ...u, role: 'User' })} />
          }
        />

        {/* Dashboard route */}
        <Route
          path="/"
          element={
            user
              ? <Dashboard user={user} onLogout={() => setUser(null)} />
              : <Navigate to="/login" replace />
          }
        />

        {/* Board route — joinable by shared link */}
        <Route
          path="/board/:boardId"
          element={
            user
              ? <BoardRoom user={user} />
              : <Navigate to="/login" replace />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
