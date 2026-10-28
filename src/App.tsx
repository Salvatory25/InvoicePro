import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicWebsite } from './pages/PublicWebsite';
import { AuthPages } from './pages/AuthPages';
import { WorkspaceApp } from './pages/WorkspaceApp';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { SuperAdminPage } from './pages/SuperAdminPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Marketing & SEO Pages */}
      <Route path="/" element={<PublicWebsite page="home" />} />
      <Route path="/features" element={<PublicWebsite page="features" />} />
      <Route path="/pricing" element={<PublicWebsite page="pricing" />} />
      <Route path="/use-cases" element={<PublicWebsite page="use-cases" />} />
      <Route path="/help" element={<PublicWebsite page="help" />} />
      <Route path="/faq" element={<PublicWebsite page="faq" />} />
      <Route path="/contact" element={<PublicWebsite page="contact" />} />
      <Route path="/privacy" element={<PublicWebsite page="privacy" />} />
      <Route path="/terms" element={<PublicWebsite page="terms" />} />

      {/* Authentication & Onboarding */}
      <Route path="/login" element={<AuthPages mode="login" />} />
      <Route path="/register" element={<AuthPages mode="register" />} />
      <Route path="/reset-password" element={<AuthPages mode="reset" />} />
      <Route path="/onboarding" element={<AuthPages mode="onboarding" />} />

      {/* Expiring / Revocable Guest Client Portal */}
      <Route path="/portal/:token" element={<ClientPortalPage />} />

      {/* Protected Platform Super-Admin Console */}
      <Route path="/admin" element={<SuperAdminPage />} />

      {/* Protected Multi-Tenant Workspace Application */}
      <Route path="/app/*" element={<WorkspaceApp />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;

