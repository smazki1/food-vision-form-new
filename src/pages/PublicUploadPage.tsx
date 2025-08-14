
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PublicUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const current = encodeURIComponent(location.pathname + location.search);
    navigate(`/customer/auth?redirect=/customer/upload&from=${current}`, { replace: true });
  }, [navigate, location]);

  return null;
};

export default PublicUploadPage;
