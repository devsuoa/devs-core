import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkAdminAuthorization, handleLogout } from './auth';

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthorized = await checkAdminAuthorization();
      if (!isAuthorized) {
        navigate('/admin/login');
        return;
      }
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return {
    loading,
    authorized,
    onLogout,
  };
}

