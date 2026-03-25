import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/Login/Login';
import { StatsPage } from './pages/Stats/Stats';
import { LobbiesPage } from './pages/Lobbies/Lobbies';
import { UsersPage } from './pages/Users/Users';
import { DecksPage } from './pages/Decks/Decks';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StatsPage />} />
          <Route path="lobbies" element={<LobbiesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="decks" element={<DecksPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
