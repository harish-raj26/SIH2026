import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BusinessesPage } from './pages/businesses/BusinessesPage';
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { ApplicationWizardPage } from './pages/applications/ApplicationWizardPage';
import { ApplicationDetailsPage } from './pages/applications/ApplicationDetailsPage';
import { DocumentsHubPage } from './pages/documents/DocumentsHubPage';
import { AiAssistantPage } from './pages/ai/AiAssistantPage';
import { SearchPage } from './pages/search/SearchPage';
import { OfficerPortalPage } from './pages/officer/OfficerPortalPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

import { USER_ROLES } from './utils/constants';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BusinessProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* Protected Core Platform Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/businesses" element={<BusinessesPage />} />
                  <Route path="/approvals" element={<ApprovalsPage />} />
                  <Route path="/applications/new" element={<ApplicationWizardPage />} />
                  <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
                  <Route path="/documents" element={<DocumentsHubPage />} />
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />
                  <Route path="/search" element={<SearchPage />} />

                  {/* Officer / Admin Exclusive Routes */}
                  <Route
                    path="/officer-portal"
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.OFFICER, USER_ROLES.ADMIN]}>
                        <OfficerPortalPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </BusinessProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
