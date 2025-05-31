import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/customer-login", { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
