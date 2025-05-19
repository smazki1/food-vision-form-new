import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ClientDetailsTab from "@/components/food-vision/ClientDetailsTab";
import DishesTab from "@/components/food-vision/DishesTab";
import CocktailsTab from "@/components/food-vision/CocktailsTab";
import DrinksTab from "@/components/food-vision/DrinksTab";
import AdditionalDetailsTab from "@/components/food-vision/AdditionalDetailsTab";
import SubmissionsTab from "@/components/food-vision/SubmissionsTab";
import RemainingServingsCard from "@/components/food-vision/RemainingServingsCard";
import FormNavigation from "@/components/food-vision/FormNavigation";
import FormHeader from "@/components/food-vision/FormHeader";
import FormErrorMessage from "@/components/food-vision/FormErrorMessage";
import FormProgressMessage from "@/components/food-vision/FormProgressMessage";
import ThankYouModal from "@/components/food-vision/ThankYouModal";
import { useFoodVisionForm } from "@/hooks/use-food-vision-form";
import { useSubmissions } from "@/hooks/useSubmissions";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useFoodVisionFormValidation } from "@/hooks/useFoodVisionFormValidation";
import { useFoodVisionFormSubmission } from "@/hooks/useFoodVisionFormSubmission";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

const FoodVisionForm: React.FC = () => {
  const { user } = useCustomerAuth();
  const { clientId, authenticating } = useClientAuth();
  console.log("FoodVisionForm - User:", user);
  console.log("FoodVisionForm - ClientID:", clientId, "Authenticating:", authenticating);
  const { clientProfile } = useClientProfile(user?.id);
  
  const {
    activeTab, setActiveTab,
    clientDetails, setClientDetails,
    dishes, setDishes,
    cocktails, setCocktails,
    drinks, setDrinks,
    additionalDetails, setAdditionalDetails,
    handleSubmit
  } = useFoodVisionForm();

  // Get submissions and remaining servings for the client
  const { submissions, remainingServings, loading: loadingSubmissions } = useSubmissions();

  // Pre-fill client details from profile if user is logged in
  useEffect(() => {
    if (clientProfile && Object.keys(clientDetails).some(key => !clientDetails[key as keyof typeof clientDetails])) {
      setClientDetails({
        restaurantName: clientProfile.restaurant_name || clientDetails.restaurantName,
        contactName: clientProfile.contact_name || clientDetails.contactName,
        phoneNumber: clientProfile.phone || clientDetails.phoneNumber,
        email: clientProfile.email || clientDetails.email,
      });
    }
  }, [clientProfile, clientDetails, setClientDetails]);

  // Form validation
  const { 
    submitError, 
    setSubmitError, 
    validateForm 
  } = useFoodVisionFormValidation(clientDetails, setActiveTab);

  // Form submission handling
  const { 
    isSubmitting, 
    submitProgressMsg, 
    showThankYou, 
    handleFormSubmit,
    handleCloseThankYou,
    isSubmitDisabled: submissionHookSubmitDisabled
  } = useFoodVisionFormSubmission({
    handleSubmit,
    validateForm,
    setSubmitError,
    clientId,
    remainingServings
  });

  // DIAGNOSTIC: Temporarily remove `authenticating` from the disabled condition
  // const finalIsSubmitDisabled = authenticating || !clientId || submissionHookSubmitDisabled;
  const finalIsSubmitDisabled = !clientId || submissionHookSubmitDisabled;

  // Handle tab change
  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    // Clear any validation errors when changing tabs
    setSubmitError(null);
  };

  // Ensure dishes have valid referenceImages arrays
  const safeDishes = Array.isArray(dishes)
    ? dishes.map(dish => ({
        ...dish,
        referenceImages: Array.isArray(dish.referenceImages) ? dish.referenceImages : []
      }))
    : [];

  // Check if user is logged in to determine if client details should be editable
  const isClientDetailsEditable = !user;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <FormHeader />

        {clientId && !authenticating && (
          <div className="mb-6">
            <RemainingServingsCard 
              remainingServings={remainingServings} 
              loading={loadingSubmissions} 
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Validation Error Alert */}
          <FormErrorMessage error={submitError} />

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
              <ClientDetailsTab clientDetails={clientDetails} setClientDetails={setClientDetails} readOnly={!isClientDetailsEditable} />
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

          {/* Submission progress message */}
          <div className="w-full flex flex-col items-center mt-2 mb-2">
            <FormProgressMessage message={submitProgressMsg} />
          </div>

          <FormNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
            handleSubmit={handleFormSubmit}
            isSubmitDisabled={finalIsSubmitDisabled}
          />
        </div>
      </div>
      
      {/* Thank You Modal - Only shown after successful submission */}
      <ThankYouModal open={showThankYou} onClose={handleCloseThankYou} />
    </div>
  );
};

export default FoodVisionForm;
