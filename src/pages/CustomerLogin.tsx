
import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to the new customer login page
const CustomerLogin: React.FC = () => {
  return <Navigate to="/customer-login" replace />;
};

export default CustomerLogin;
