import React, { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ClientDetailsTab from "@/components/food-vision/ClientDetailsTab";
import DishesTab from "@/components/food-vision/DishesTab";
import CocktailsTab from "@/components/food-vision/CocktailsTab";
import DrinksTab from "@/components/food-vision/DrinksTab";
import AdditionalDetailsTab from "@/components/food-vision/AdditionalDetailsTab";
import FormNavigation from "@/components/food-vision/FormNavigation";
import { useFoodVisionForm } from "@/hooks/use-food-vision-form";

const FoodVisionForm: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    clientDetails,
    setClientDetails,
    dishes,
    setDishes,
    cocktails,
    setCocktails,
    drinks,
    setDrinks,
    additionalDetails,
    setAdditionalDetails,
    isSubmitting,
    handleSubmit
  } = useFoodVisionForm();
  
  const [submissionStatus, setSubmissionStatus] = React.useState<"success" | "error" | null>(null);
  const [submissionMessage, setSubmissionMessage] = React.useState<string>("");

  useEffect(() => {
    console.log("FoodVisionForm rendered with activeTab:", activeTab);
    console.log("Dishes data:", dishes);
  }, [activeTab, dishes]);
  
  const handleTabChange = (nextTab: string) => {
    console.log("Tab changing from", activeTab, "to", nextTab);
    setActiveTab(nextTab);
  };
  
  const safeDishes = Array.isArray(dishes) ? dishes.map(dish => ({
    ...dish,
    referenceImages: Array.isArray(dish.referenceImages) ? dish.referenceImages : []
  })) : [];

  const customHandleSubmit = async () => {
    setSubmissionStatus(null);
    setSubmissionMessage("");
    try {
      await handleSubmit();
      setSubmissionStatus("success");
      setSubmissionMessage("תודה! הטופס נשלח בהצלחה. נחזור אליך תוך 24 שעות.");
    } catch (error) {
      setSubmissionStatus("error");
      setSubmissionMessage("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב.");
    }
  };

  const tabLabelClass =
    "data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white text-sm sm:text-base px-1 sm:px-3 py-2 rounded transition font-semibold whitespace-nowrap text-center flex-1 items-center justify-center";

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-2 sm:px-4 py-8">
        <header className="mb-8 text-center py-4 rounded-lg" style={{
          background: 'linear-gradient(90deg, #F97316 0%, #ea384c 100%)'
        }}>
          <h1 className="text-3xl font-bold text-white">פוד-ויז'ן AI</h1>
          <p className="text-white/90 mt-2">
            תמונות מרהיבות למסעדות בטכנולוגיית AI
          </p>
        </header>
        <div className="bg-white rounded-lg shadow-md p-2 sm:p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-6 gap-2">
              <TabsTrigger value="client" className={tabLabelClass}>פרטי המסעדה</TabsTrigger>
              <TabsTrigger value="dishes" className={tabLabelClass}>מנות</TabsTrigger>
              <TabsTrigger value="cocktails" className={tabLabelClass}>קוקטיילים</TabsTrigger>
              <TabsTrigger value="drinks" className={tabLabelClass}>שתייה</TabsTrigger>
              <TabsTrigger value="additional" className={tabLabelClass}>פרטים נוספים</TabsTrigger>
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
          </Tabs>
          <FormNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
            handleSubmit={customHandleSubmit}
            submissionStatus={submissionStatus}
            submissionMessage={submissionMessage}
            setSubmissionStatus={setSubmissionStatus}
            setSubmissionMessage={setSubmissionMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default FoodVisionForm;
