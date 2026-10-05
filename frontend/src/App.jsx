import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PageSkeleton } from './components/ui/Skeleton';
import FloatingAICareerAdvisor from './components/FloatingAICareerAdvisor';

// Lazy-loaded routes for performance & smooth skeleton transitions
const ResumeUploadPage = lazy(() => import('./pages/ResumeUploadPage'));
const ProfileReviewPage = lazy(() => import('./pages/ProfileReviewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const SkillGapPage = lazy(() => import('./pages/SkillGapPage'));
const AICareerAdvisorPage = lazy(() => import('./pages/AICareerAdvisorPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
          <FloatingAICareerAdvisor />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Routes with Navbar and Footer */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

            {/* Authenticated Routes with Dedicated Sidebar + Topbar */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPlaceholder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute>
                  <OpportunitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/:id"
              element={
                <ProtectedRoute>
                  <OpportunitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumeUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/skill-gap"
              element={
                <ProtectedRoute>
                  <SkillGapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-advisor"
              element={
                <ProtectedRoute>
                  <AICareerAdvisorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/review"
              element={
                <ProtectedRoute>
                  <ProfileReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to /dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  );
}
