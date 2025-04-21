
import React from "react";
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
    handleSubmit,
  } = useFoodVisionForm();

  const handleTabChange = (nextTab: string) => {
    const tabs = ["client", "dishes", "cocktails", "drinks", "additional"];
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = tabs.indexOf(nextTab);
    
    if (Math.abs(currentIndex - nextIndex) === 1) {
      setActiveTab(nextTab);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#8B1E3F]">פוד-ויז'ן AI</h1>
          <p className="text-muted-foreground mt-2">
            תמונות מרהיבות למסעדות בטכנולוגיית AI
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-8">
              <TabsTrigger 
                value="client" 
                className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white"
              >
                פרטי לקוח
              </TabsTrigger>
              <TabsTrigger 
                value="dishes"
                className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white"
              >
                מנות
              </TabsTrigger>
              <TabsTrigger 
                value="cocktails"
                className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white"
              >
                קוקטיילים
              </TabsTrigger>
              <TabsTrigger 
                value="drinks"
                className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white"
              >
                שתייה
              </TabsTrigger>
              <TabsTrigger 
                value="additional"
                className="data-[state=active]:bg-[#8B1E3F] data-[state=active]:text-white"
              >
                פרטים נוספים
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <ClientDetailsTab 
                clientDetails={clientDetails} 
                setClientDetails={setClientDetails} 
              />
            </TabsContent>

            <TabsContent value="dishes">
              <DishesTab 
                dishes={dishes} 
                setDishes={setDishes} 
              />
            </TabsContent>

            <TabsContent value="cocktails">
              <CocktailsTab 
                cocktails={cocktails} 
                setCocktails={setCocktails} 
              />
            </TabsContent>

            <TabsContent value="drinks">
              <DrinksTab 
                drinks={drinks} 
                setDrinks={setDrinks} 
              />
            </TabsContent>

            <TabsContent value="additional">
              <AdditionalDetailsTab 
                additionalDetails={additionalDetails}
                setAdditionalDetails={setAdditionalDetails}
              />
            </TabsContent>
          </Tabs>

          <FormNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNext={() => {
              const tabs = ["client", "dishes", "cocktails", "drinks", "additional"];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1]);
              }
            }}
            onPrev={() => {
              const tabs = ["client", "dishes", "cocktails", "drinks", "additional"];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1]);
              }
            }}
            isLastTab={activeTab === "additional"}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default FoodVisionForm;
