import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardProvider } from './context/DashboardContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { PodsPage } from './pages/PodsPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { NodesPage } from './pages/NodesPage';
import { ServicesPage } from './pages/ServicesPage';
import { RbacPage } from './pages/RbacPage';
import { ToastContainer } from './components/ToastContainer';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected dashboard routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <OverviewPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/pods"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <PodsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/deployments"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DeploymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/nodes"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <NodesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ServicesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/rbac"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <RbacPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Global toast overlay */}
            <ToastContainer />
          </BrowserRouter>
        </DashboardProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
