import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Guard
 * Modeled after Nokk-FE and EMS-FE standard route protection patterns.
 * 
 * Props:
 *   allowedRoles / roles {string[]} - Allowed roles (e.g. ['Admin', 'Developer']); if omitted, allows any logged-in user.
 *   redirectTo {string} - Route to redirect unauthenticated users to (default: /login).
 *   children {ReactNode} - Fallback for non-nested usage.
 */
export const ProtectedRoute = ({ allowedRoles, roles, redirectTo = '/login', children }) => {
  const { isAuthenticated, user } = useAuth();
  const validRoles = allowedRoles || roles;

  // 1. Unauthenticated users -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Role-restricted routes -> check user role
  if (validRoles && validRoles.length > 0) {
    if (!user?.role || !validRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // 3. Return children if passed, otherwise render nested <Outlet />
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
