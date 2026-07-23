import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DashboardProvider } from "./context/DashboardContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PodsPage } from "./pages/PodsPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { NodesPage } from "./pages/NodesPage";
import { ServicesPage } from "./pages/ServicesPage";
import { RbacPage } from "./pages/RbacPage";
import { ToastContainer } from "./components/ToastContainer";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Dashboard Routes — ProtectedRoute verifies authentication & role */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/overview" element={<Navigate to="/" replace />} />
          <Route path="/pods" element={<PodsPage />} />
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/nodes" element={<NodesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/rbac" element={<RbacPage />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardProvider>
          <BrowserRouter>
            <AppRoutes />
            {/* Global toast overlay */}
            <ToastContainer />
          </BrowserRouter>
        </DashboardProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
