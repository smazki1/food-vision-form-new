import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export interface CustomerProfile {
  clientId: string;
  restaurantName: string;
  contactName: string;
  email: string;
  phone: string;
  remainingServings: number;
  clientStatus: string;
}

export const useCustomerAuth = () => {
  const [isCustomer, setIsCustomer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Fetch customer profile data
  const { data: customerProfile, refetch: refetchProfile } = useQuery<CustomerProfile | null>({
    queryKey: ["customerProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: clientData, error } = await supabase
        .from("clients")
        .select(`
          client_id,
          restaurant_name,
          contact_name,
          email,
          phone,
          remaining_servings,
          client_status
        `)
        .eq("user_auth_id", user.id)
        .single();

      if (error) throw error;
      
      return clientData ? {
        clientId: clientData.client_id,
        restaurantName: clientData.restaurant_name,
        contactName: clientData.contact_name,
        email: clientData.email,
        phone: clientData.phone,
        remainingServings: clientData.remaining_servings,
        clientStatus: clientData.client_status
      } : null;
    },
    enabled: false // Don't run automatically
  });

  useEffect(() => {
    checkCustomerStatus();
  }, []);

  const checkCustomerStatus = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsCustomer(false);
        return;
      }

      // Check if user has a linked client record
      const { data: client, error } = await supabase
        .from("clients")
        .select("client_id")
        .eq("user_auth_id", user.id)
        .single();

      if (error) {
        console.error("Error checking client status:", error);
        setIsCustomer(false);
        return;
      }

      setIsCustomer(!!client);
      
      // If customer exists, fetch their profile data
      if (client) {
        refetchProfile();
      }
    } catch (error) {
      console.error("Error checking customer status:", error);
      setIsCustomer(false);
    } finally {
      setLoading(false);
    }
  };

  const customerLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has a linked client record
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("client_id")
        .eq("user_auth_id", data.user.id)
        .single();

      if (clientError || !client) {
        await supabase.auth.signOut();
        return { success: false, error: "משתמש לא מורשה" };
      }

      setIsCustomer(true);
      await refetchProfile();
      
      return { success: true, error: null };
    } catch (error) {
      console.error("Customer login error:", error);
      return { success: false, error };
    }
  };

  const customerLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsCustomer(false);
      navigate("/login");
      return { success: true, error: null };
    } catch (error) {
      console.error("Customer logout error:", error);
      return { success: false, error };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("נשלח קישור לאיפוס סיסמה לכתובת המייל שלך");
      return { success: true, error: null };
    } catch (error) {
      console.error("Forgot password error:", error);
      return { success: false, error };
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("הסיסמה עודכנה בהצלחה");
      navigate("/login");
      return { success: true, error: null };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error };
    }
  };

  return {
    isCustomer,
    loading,
    customerProfile,
    customerLogin,
    customerLogout,
    forgotPassword,
    resetPassword,
    refetchProfile
  };
}; 