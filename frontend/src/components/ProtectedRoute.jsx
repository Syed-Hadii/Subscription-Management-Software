import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from "@material-tailwind/react";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return  <div className="flex items-center justify-center py-20">
              <Spinner className="h-10 w-10 text-blue-600" />
            </div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" />;
  }

  return children;
};
