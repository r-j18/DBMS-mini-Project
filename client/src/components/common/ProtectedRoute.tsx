import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RestrictedPage } from './RestrictedPage';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F0] dark:bg-[#1A1C1F]">
        <div className="w-48 h-1 bg-[#1F2D3D] rounded-full overflow-hidden relative mb-4">
          <div className="absolute inset-0 bg-[#B08D3C] animate-pulse" />
        </div>
        <p className="font-typewriter text-xs text-[#7A7A7A] uppercase tracking-widest">
          Verifying Bureau Credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and remember intended path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <RestrictedPage />;
  }

  return <>{children}</>;
};
