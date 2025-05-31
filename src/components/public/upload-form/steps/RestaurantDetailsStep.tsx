import React, { useEffect, FC, useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';
import { Building2, User, Mail, Phone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const restaurantDetailsSchema = z.object({
  restaurantName: z.string().min(1, "שם המסעדה הוא שדה חובה"),
  submitterName: z.string().min(1, "שם המגיש הוא שדה חובה"),
  contactEmail: z.string().email({ message: "כתובת אימייל לא תקינה" }).optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
});

// סכמה נוספת עבור מצב "עסק חדש" - בו המייל והטלפון הם שדות חובה
const newBusinessSchema = z.object({
  restaurantName: z.string().min(1, "שם המסעדה הוא שדה חובה"),
  submitterName: z.string().min(1, "שם המגיש הוא שדה חובה"),
  contactEmail: z.string().email({ message: "כתובת אימייל לא תקינה" }).min(1, "אימייל הוא שדה חובה לעסק חדש"),
  contactPhone: z.string().min(1, "מספר טלפון הוא שדה חובה לעסק חדש"),
});

type RestaurantDetailsFormData = z.infer<typeof restaurantDetailsSchema>;

export const RestaurantDetailsStep: FC<PublicStepProps> = ({ errors: externalErrors, clearExternalErrors }) => {
  const { formData, updateFormData } = useNewItemForm();
  const [isNewBusiness, setIsNewBusiness] = useState<boolean | null>(null);
  
  const form = useForm<RestaurantDetailsFormData>({
    resolver: zodResolver(isNewBusiness ? newBusinessSchema : restaurantDetailsSchema),
    defaultValues: {
      restaurantName: formData.restaurantName || '',
      submitterName: formData.submitterName || '',
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
    },
    mode: 'onChange'
  });
  
  // עדכון הסכמה כאשר משתנה סטטוס העסק (חדש/קיים)
  useEffect(() => {
    form.clearErrors();
    // ברגע שמשתנה סטטוס העסק, מעדכנים את ה-resolver של הטופס
    form.setError = form.setError;
  }, [isNewBusiness, form]);

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

  // Update global form data context on local form change
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData(value as Partial<RestaurantDetailsFormData>);
    });
    return () => subscription.unsubscribe();
  }, [form, updateFormData]);

  // Handle blur for individual field validation and context update
  const handleBlur = (fieldName: keyof RestaurantDetailsFormData) => {
    form.trigger(fieldName);
    const fieldValue = form.getValues(fieldName);
    // Ensure that we only update if the value is a string, as per the context expectations
    if (typeof fieldValue === 'string') {
      updateFormData({ [fieldName]: fieldValue });
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

      {/* בחירת סטטוס העסק - חדש במערכת או קיים */}
      {!isAuthenticated && (
        <div className="mb-6 p-5 bg-blue-50 rounded-lg shadow-sm">
          <p className="font-medium mb-3 text-lg text-center">האם העסק שלכם כבר רשום במערכת?</p>
          <div className="flex justify-center gap-4 mt-2">
            <button 
              onClick={() => setIsNewBusiness(false)}
              type="button"
              className={cn(
                "px-5 py-2 rounded-md transition-all duration-300 text-base font-medium",
                isNewBusiness === false 
                  ? "bg-[#F3752B] text-white border-2 border-[#F3752B]" 
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-[#F3752B]/50"
              )}
            >
              כן, העסק שלנו רשום
              {isNewBusiness === false && <CheckCircle className="inline-block mr-2 h-4 w-4" />}
            </button>
            <button 
              onClick={() => setIsNewBusiness(true)}
              type="button"
              className={cn(
                "px-5 py-2 rounded-md transition-all duration-300 text-base font-medium",
                isNewBusiness === true 
                  ? "bg-[#F3752B] text-white border-2 border-[#F3752B]" 
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-[#F3752B]/50"
              )}
            >
              לא, זו פעם ראשונה שלנו
              {isNewBusiness === true && <CheckCircle className="inline-block mr-2 h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

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
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <FormField
            control={form.control}
            name="restaurantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-lg font-semibold text-[#333333]">
                  <div className="bg-[#F3752B]/10 p-2 rounded-full mr-2">
                    <Building2 className="w-5 h-5 text-[#F3752B]" />
                  </div>
                  שם המסעדה / שם העסק
                  <span className="text-red-500 mr-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={() => handleBlur("restaurantName")}
                    placeholder="הזינו את שם המסעדה או העסק"
                    className={cn(
                      "w-full px-6 py-4 text-lg border-2 rounded-xl",
                      form.formState.errors.restaurantName ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
                    )}
                  />
                </FormControl>
                <FormDescription>
                  אם העסק כבר קיים במערכת, כתבו את השם שלו כפי שהוא מופיע.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="submitterName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-lg font-semibold text-[#333333]">
                  <div className="bg-[#F3752B]/10 p-2 rounded-full mr-2">
                    <User className="w-5 h-5 text-[#F3752B]" />
                  </div>
                  שם מלא של המגיש
                  <span className="text-red-500 mr-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={() => handleBlur("submitterName")}
                    placeholder="הזינו את שם איש הקשר"
                    className={cn(
                      "w-full px-6 py-4 text-lg border-2 rounded-xl",
                      form.formState.errors.submitterName ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(isNewBusiness === true || isAuthenticated) && (
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg font-semibold text-[#333333]">
                    <div className="bg-[#F3752B]/10 p-2 rounded-full mr-2">
                      <Mail className="w-5 h-5 text-[#F3752B]" />
                    </div>
                    אימייל לקבל תוצאות
                    {isNewBusiness && <span className="text-red-500 mr-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      onBlur={() => handleBlur("contactEmail")}
                      placeholder="לדוגמה: email@example.com"
                      className={cn(
                        "w-full px-6 py-4 text-lg border-2 rounded-xl",
                        form.formState.errors.contactEmail ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    {isNewBusiness ? "אנו נשלח את תוצאות הפניה שלך לכתובת זו" : "מומלץ להשאיר פרטים כדי שנוכל ליצור איתך קשר"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(isNewBusiness === true || isAuthenticated) && (
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-lg font-semibold text-[#333333]">
                    <div className="bg-[#F3752B]/10 p-2 rounded-full mr-2">
                      <Phone className="w-5 h-5 text-[#F3752B]" />
                    </div>
                    טלפון ליצירת קשר
                    {isNewBusiness && <span className="text-red-500 mr-1">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      onBlur={() => handleBlur("contactPhone")}
                      placeholder="לדוגמה: 050-1234567"
                      className={cn(
                        "w-full px-6 py-4 text-lg border-2 rounded-xl",
                        form.formState.errors.contactPhone ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[#F3752B] bg-white hover:border-gray-300"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </div>
  );
};

export default RestaurantDetailsStep;
