
import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ClientDetailsTab from "@/components/food-vision/ClientDetailsTab";
import DishesTab from "@/components/food-vision/DishesTab";
import CocktailsTab from "@/components/food-vision/CocktailsTab";
import DrinksTab from "@/components/food-vision/DrinksTab";
import AdditionalDetailsTab from "@/components/food-vision/AdditionalDetailsTab";
import SubmissionsTab from "@/components/food-vision/SubmissionsTab";
import RemainingServingsCard from "@/components/food-vision/RemainingServingsCard";
import FormNavigation from "@/components/food-vision/FormNavigation";
import { useFoodVisionForm } from "@/hooks/use-food-vision-form";
import { useSubmissions } from "@/hooks/useSubmissions";
import ThankYouModal from "@/components/food-vision/ThankYouModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FoodVisionForm: React.FC = () => {
  // Hard-coded client ID for demo purposes
  // In a real implementation, this would come from authentication
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [authenticating, setAuthenticating] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // In a real app, we would fetch the client_id associated with this user
          // For demo purposes, we could hard-code a client_id for testing
          // setClientId("some-client-id-from-authenticated-user");
          console.log("User authenticated:", user);
        } else {
          console.log("No authenticated user found");
        }
        setAuthenticating(false);
      } catch (error) {
        console.error("Auth error:", error);
        setAuthenticating(false);
      }
    }
    
    checkAuth();
  }, []);

  const {
    activeTab, setActiveTab,
    clientDetails, setClientDetails,
    dishes, setDishes,
    cocktails, setCocktails,
    drinks, setDrinks,
    additionalDetails, setAdditionalDetails,
    isSubmitting, handleSubmit
  } = useFoodVisionForm();

  // Get submissions and remaining servings for the client
  const { submissions, remainingServings, loading: loadingSubmissions } = useSubmissions(clientId);

  // Modal & alert UX states
  const [showThankYou, setShowThankYou] = useState(false);
  const [submitProgressMsg, setSubmitProgressMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(true);

  // Check if client details are valid
  useEffect(() => {
    const isValid = Boolean(
      clientDetails.restaurantName &&
      clientDetails.contactName &&
      clientDetails.phoneNumber &&
      clientDetails.email
    );
    setIsFormValid(isValid);
    console.log("Form validation state:", { isValid, clientDetails });
  }, [clientDetails]);

  // Scroll to error message if it exists
  useEffect(() => {
    if (submitError) {
      const errorElement = document.getElementById('form-error-message');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [submitError]);

  useEffect(() => {
    if (isSubmitting) {
      setSubmitProgressMsg("התהליך יכול לקחת מספר שניות. נא לא לצאת מהעמוד.");
      setSubmitError(null);
    } else {
      setSubmitProgressMsg(null);
    }
  }, [isSubmitting]);

  // Validate form before submission
  const validateForm = () => {
    if (!clientDetails.restaurantName ||
        !clientDetails.contactName ||
        !clientDetails.phoneNumber ||
        !clientDetails.email) {
      setIsFormValid(false);
      setSubmitError("אנא מלא את כל שדות החובה בכרטיסיית פרטי הלקוח");
      setActiveTab("client");
      return false;
    }
    return true;
  };

  // Overwrite handleSubmit for custom handling
  const handleFormSubmit = async () => {
    // Reset previous error states
    setSubmitError(null);
    setIsFormValid(true);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitProgressMsg("התהליך יכול לקחת מספר שניות. נא לא לצאת מהעמוד.");
    try {
      const result = await handleSubmit({
        clientId: clientId // Pass the client ID to the submit handler
      });
      
      if (result && result.success) {
        setShowThankYou(true);
      } else if (result && !result.success) {
        setSubmitError(result.message || "אירעה שגיאה בעת שליחת הטופס");
      }
    } catch (err: any) {
      setSubmitError("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב מאוחר יותר.");
    } finally {
      setSubmitProgressMsg(null);
    }
  };

  const handleCloseThankYou = () => setShowThankYou(false);

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    // Clear any validation errors when changing tabs
    setSubmitError(null);
  };

  const safeDishes = Array.isArray(dishes)
    ? dishes.map(dish => ({
        ...dish,
        referenceImages: Array.isArray(dish.referenceImages) ? dish.referenceImages : []
      }))
    : [];

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 text-center py-4 rounded-lg" style={{
          background: 'linear-gradient(90deg, #F97316 0%, #ea384c 100%)'
        }}>
          <h1 className="text-3xl font-bold text-white">פוד-ויז'ן AI</h1>
          <p className="text-white/90 mt-2">
            תמונות מרהיבות למסעדות בטכנולוגיית AI
          </p>
        </header>

        {clientId && !authenticating && (
          <div className="mb-6">
            <RemainingServingsCard 
              remainingServings={remainingServings} 
              loading={loadingSubmissions} 
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Validation Error Alert - More visible */}
          {submitError && (
            <div 
              id="form-error-message"
              className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-lg mb-6 animate-pulse flex items-center gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-6 mb-8">
              <TabsTrigger value="client" className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-xs sm:text-base">
                פרטי המסעדה
              </TabsTrigger>
              <TabsTrigger value="dishes" className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-xs sm:text-base">
                מנות
              </TabsTrigger>
              <TabsTrigger value="cocktails" className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-xs sm:text-base">
                קוקטיילים
              </TabsTrigger>
              <TabsTrigger value="drinks" className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-xs sm:text-base">
                שתייה
              </TabsTrigger>
              <TabsTrigger value="additional" className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-xs sm:text-base">
                פרטים נוספים
              </TabsTrigger>
              {clientId && (
                <TabsTrigger value="submissions" className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-xs sm:text-base">
                  הגשות
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="client">
              <ClientDetailsTab clientDetails={clientDetails} setClientDetails={setClientDetails} />
            </TabsContent>
            <TabsContent value="dishes">
              <DishesTab dishes={safeDishes} setDishes={setDishes} />
            </TabsContent>
            <TabsContent value="cocktails">
              <CocktailsTab cocktails={cocktails || []} setCocktails={setCocktails} />
            </TabsContent>
            <TabsContent value="drinks">
              <DrinksTab drinks={drinks || []} setDrinks={setDrinks} />
            </TabsContent>
            <TabsContent value="additional">
              <AdditionalDetailsTab additionalDetails={additionalDetails} setAdditionalDetails={setAdditionalDetails} />
            </TabsContent>
            {clientId && (
              <TabsContent value="submissions">
                <SubmissionsTab submissions={submissions} loading={loadingSubmissions} />
              </TabsContent>
            )}
          </Tabs>

          {/* Submission progress/Error messages */}
          <div className="w-full flex flex-col items-center mt-2 mb-2">
            {submitProgressMsg && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mb-2 w-full text-center text-yellow-900 text-base font-medium shadow-sm transition-all">
                {submitProgressMsg}
              </div>
            )}
          </div>

          <FormNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
            handleSubmit={handleFormSubmit}
            isSubmitDisabled={clientId && remainingServings <= 0}
          />
        </div>
      </div>
      {/* Thank You Modal - Only shown after successful submission */}
      <ThankYouModal open={showThankYou} onClose={handleCloseThankYou} />
    </div>
  );
};

export default FoodVisionForm;
