import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProgramProvider } from './contexts/ProgramContext';
import { CalendarTaskProvider } from './contexts/CalendarTaskContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import ProgramList from './components/ProgramList';
import KanbanBoard from './components/KanbanBoard';
import Calendar from './components/Calendar';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log('🛡️ PrivateRoute check:', { user: user ? 'EXISTS' : 'NULL', loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-text-primary">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ User authenticated, rendering protected content');
  return <>{children}</>;
}

function App() {
  console.log('📱 App component initializing...');
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ProgramProvider>
                  <CalendarTaskProvider>
                    <Layout />
                  </CalendarTaskProvider>
                </ProgramProvider>
              </PrivateRoute>
            }
          >
            <Route index element={<ProgramList />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="calendar" element={<Calendar />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;