
import { useEffect } from "react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export const useClientAuth = () => {
  const { user, loading } = useCustomerAuth();

  useEffect(() => {
    if (user) {
      console.log("User authenticated:", user);
    } else if (!loading) {
      console.log("No authenticated user found");
    }
  }, [user, loading]);

  return { clientId: user?.id, authenticating: loading };
};
