import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PageSkeleton } from './components/ui/Skeleton';
import FloatingAICareerAdvisor from './components/FloatingAICareerAdvisor';

// Lazy-loaded routes for performance & smooth skeleton transitions
const DashboardPlaceholder = lazy(() => import('./pages/DashboardPlaceholder'));
const ProfileReviewPage = lazy(() => import('./pages/ProfileReviewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const SkillGapPage = lazy(() => import('./pages/SkillGapPage'));
const AICareerAdvisorPage = lazy(() => import('./pages/AICareerAdvisorPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MockTestProctoredPage = lazy(() => import('./pages/MockTestProctoredPage'));
const InterviewSimulatorProctoredPage = lazy(() => import('./pages/InterviewSimulatorProctoredPage'));

// Admin Workspace Routes
const AdminRoute = lazy(() => import('./components/AdminRoute'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminOpportunitiesPage = lazy(() => import('./pages/admin/AdminOpportunitiesPage'));
const AdminSourcesPage = lazy(() => import('./pages/admin/AdminSourcesPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

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
                <Route path="/design-system" element={<Navigate to="/dashboard" replace />} />
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
              path="/applications/:appId/mock-test/:testId"
              element={
                <ProtectedRoute>
                  <MockTestProctoredPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:appId/mock-test"
              element={
                <ProtectedRoute>
                  <MockTestProctoredPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:appId/interview/:sessionId"
              element={
                <ProtectedRoute>
                  <InterviewSimulatorProctoredPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:appId/interview"
              element={
                <ProtectedRoute>
                  <InterviewSimulatorProctoredPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumeBuilderPage />
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

            {/* Admin Workspace Routes */}
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route
              path="/admin/overview"
              element={
                <AdminRoute>
                  <AdminOverviewPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/opportunities"
              element={
                <AdminRoute>
                  <AdminOpportunitiesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sources"
              element={
                <AdminRoute>
                  <AdminSourcesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalyticsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/feedback"
              element={
                <AdminRoute>
                  <AdminFeedbackPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminAuditLogsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettingsPage />
                </AdminRoute>
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
