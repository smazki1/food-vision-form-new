import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const RestaurantDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const errors = externalErrors || {};

  // Get current user session directly from Supabase
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['current-session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[RestaurantDetailsStep] Session error:', error);
        return null;
      }
      console.log('[RestaurantDetailsStep] Current session:', session);
      return session;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const isAuthenticated = !!session?.user;
  const userAuthId = session?.user?.id || null;

  console.log('[RestaurantDetailsStep] Auth state:', { 
    isAuthenticated, 
    userAuthId,
    sessionLoading,
    currentFormData: formData 
  });

  // Query to fetch client details if user is authenticated
  const { data: clientData, isLoading: isLoadingClientData, error: clientError } = useQuery({
    queryKey: ['client-details', userAuthId],
    queryFn: async () => {
      if (!userAuthId) {
        console.log('[RestaurantDetailsStep] No userAuthId, skipping query');
        return null;
      }
      
      console.log('[RestaurantDetailsStep] Fetching client data for userAuthId:', userAuthId);
      
      const { data, error } = await supabase
        .from('clients')
        .select('restaurant_name, contact_name, email, phone')
        .eq('user_auth_id', userAuthId)
        .single();

      if (error) {
        console.error('[RestaurantDetailsStep] Error fetching client data:', error);
        return null;
      }

      console.log('[RestaurantDetailsStep] Client data fetched successfully:', data);
      return data;
    },
    enabled: !!userAuthId && isAuthenticated && !sessionLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Auto-fill form data when client data is loaded
  useEffect(() => {
    console.log('[RestaurantDetailsStep] useEffect triggered:', {
      clientData,
      isAuthenticated,
      isLoadingClientData,
      clientError,
      sessionLoading
    });

    if (clientData && isAuthenticated && !isLoadingClientData && !sessionLoading) {
      console.log('[RestaurantDetailsStep] Auto-filling form with client data:', {
        restaurant_name: clientData.restaurant_name,
        contact_name: clientData.contact_name
      });

      updateFormData({
        restaurantName: clientData.restaurant_name || '',
        submitterName: clientData.contact_name || ''
      });
    }
  }, [clientData, isAuthenticated, isLoadingClientData, updateFormData, clientError, sessionLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('[RestaurantDetailsStep] Manual input change:', { name, value });
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const isFieldDisabled = isAuthenticated && (isLoadingClientData || sessionLoading);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">
          פרטי מסעדה
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {isAuthenticated 
            ? "הפרטים נטענים אוטומטית מפרופיל הלקוח שלך"
            : "בואו נתחיל עם הפרטים הבסיסיים של המסעדה שלכם"
          }
        </p>
      </div>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <strong>Debug Info:</strong>
          <br />
          isAuthenticated: {String(isAuthenticated)}
          <br />
          userAuthId: {userAuthId || 'null'}
          <br />
          sessionLoading: {String(sessionLoading)}
          <br />
          isLoadingClientData: {String(isLoadingClientData)}
          <br />
          clientData: {clientData ? JSON.stringify(clientData) : 'null'}
          <br />
          formData: {JSON.stringify({ restaurantName: formData.restaurantName, submitterName: formData.submitterName })}
        </div>
      )}

      {/* Loading indicator for authenticated users */}
      {isAuthenticated && (isLoadingClientData || sessionLoading) && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-[#F3752B]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F3752B] ml-3"></div>
            טוען פרטי לקוח...
          </div>
        </div>
      )}

      {/* Error indicator */}
      {isAuthenticated && clientError && (
        <div className="text-center py-4">
          <div className="text-red-500 text-sm">
            שגיאה בטעינת פרטי הלקוח. אנא נסה לרענן את הדף.
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Restaurant Name */}
        <div className="space-y-3">
          <label htmlFor="restaurantName" className="block text-lg font-semibold text-[#333333] flex items-center">
            <Building2 className="w-6 h-6 text-[#F3752B] ml-3" />
            שם המסעדה / שם העסק
            <span className="text-red-500 mr-1">*</span>
            {isAuthenticated && (
              <span className="text-sm font-normal text-gray-500 mr-2">(נטען אוטומטית)</span>
            )}
          </label>
          <input
            id="restaurantName"
            name="restaurantName"
            type="text"
            value={formData.restaurantName || ''}
            onChange={handleChange}
            disabled={isFieldDisabled}
            placeholder={isAuthenticated ? "טוען..." : "הזינו את שם המסעדה או העסק"}
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
              isFieldDisabled && "bg-gray-50 cursor-not-allowed",
              errors?.restaurantName 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            אם העסק כבר קיים במערכת, כתבו את השם שלו
          </p>
          {errors?.restaurantName && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.restaurantName}
            </p>
          )}
        </div>

        {/* Submitter Name */}
        <div className="space-y-3">
          <label htmlFor="submitterName" className="block text-lg font-semibold text-[#333333] flex items-center">
            <User className="w-6 h-6 text-[#F3752B] ml-3" />
            שם המגיש
            <span className="text-red-500 mr-1">*</span>
            {isAuthenticated && (
              <span className="text-sm font-normal text-gray-500 mr-2">(נטען אוטומטית)</span>
            )}
          </label>
          <input
            id="submitterName"
            name="submitterName"
            type="text"
            value={formData.submitterName || ''}
            onChange={handleChange}
            disabled={isFieldDisabled}
            placeholder={isAuthenticated ? "טוען..." : "הזינו את שם איש הקשר"}
            className={cn(
              "w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F3752B]/20",
              isFieldDisabled && "bg-gray-50 cursor-not-allowed",
              errors?.submitterName 
                ? "border-red-500 bg-red-50" 
                : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
            )}
          />
          {errors?.submitterName && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
              {errors.submitterName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailsStep;
