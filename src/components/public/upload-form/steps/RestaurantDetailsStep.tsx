
import React, { useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const RestaurantDetailsStep: React.FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const { clientId, isAuthenticated } = useClientAuth();
  const errors = externalErrors || {};

  // Query to fetch client details if user is authenticated
  const { data: clientData, isLoading: isLoadingClientData } = useQuery({
    queryKey: ['client-details', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('restaurant_name, contact_name')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error('Error fetching client data:', error);
        return null;
      }

      return data;
    },
    enabled: !!clientId && isAuthenticated,
  });

  // Auto-fill form data when client data is loaded
  useEffect(() => {
    if (clientData && isAuthenticated) {
      updateFormData({
        restaurantName: clientData.restaurant_name || '',
        submitterName: clientData.contact_name || ''
      });
    }
  }, [clientData, isAuthenticated, updateFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
    if (errors && errors[name] && clearExternalErrors) {
      clearExternalErrors();
    }
  };

  const isFieldDisabled = isAuthenticated && isLoadingClientData;

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

      {/* Loading indicator for authenticated users */}
      {isAuthenticated && isLoadingClientData && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-[#F3752B]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F3752B] ml-3"></div>
            טוען פרטי לקוח...
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
            value={formData.restaurantName}
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
