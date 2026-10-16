import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ProfileRequired } from './components/layout/ProfileRequired';
import { Spinner } from './components/ui/Spinner';

// Direct Page Imports for instant routing
import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProfileSetup } from './pages/ProfileSetup';
import { Home } from './pages/Home';
import { Scanner } from './pages/Scanner';
import { MyPrograms } from './pages/MyPrograms';
import { ProgramDetail } from './pages/ProgramDetail';
import { LearnHome } from './pages/LearnHome';
import { LessonDetail } from './pages/LessonDetail';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';

// Lazy load CodeEditor because of CodeMirror and language parser size
const CodeEditor = lazy(() => import('./pages/CodeEditor'));

export const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center p-8">
            <Spinner size="lg" label="Loading CodeSaathi..." />
          </div>
        }
      >
        <Routes>
          {/* Public Authentication & Onboarding Routes */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Profile Setup Wizard (Protected, but allows users without full profile) */}
          <Route
            path="/profile/setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />

          {/* Protected Application Routes (Requires completed profile) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <Home />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <Scanner />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <CodeEditor />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor/:programId"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <CodeEditor />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/programs"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <MyPrograms />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/programs/:id"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <ProgramDetail />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <LearnHome />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/learn/:lessonId"
            element={
              <ProtectedRoute>
                <ProfileRequired>
                  <LessonDetail />
                </ProfileRequired>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard (Protected + Admin Role required) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};
export default App;
