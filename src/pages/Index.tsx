import React, { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import Hero from "../components/landing/Hero";
import BeforeAfterGallery from "../components/landing/BeforeAfterGallery";
import Benefits from "../components/landing/Benefits";
import UseCases from "../components/landing/UseCases";
import PricingPackages from "../components/landing/PricingPackages";
import Process from "../components/landing/Process";
import FAQ from "../components/landing/FAQ";
import ContactForm from "../components/landing/ContactForm";
import Footer from "../components/landing/Footer";
import CookieConsent from "../components/landing/CookieConsent";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import MobileNavigation from "../components/landing/MobileNavigation";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [businessType, setBusinessType] = useState('restaurant');
  
  useEffect(() => {
    // Redirect to /customer-login immediately on mount
    navigate('/customer-login', { replace: true });
    setLanguage("he");
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === 'bakery' || typeParam === 'restaurant') {
      setBusinessType(typeParam);
      localStorage.setItem('businessType', typeParam);
    } else {
      const savedType = localStorage.getItem('businessType');
      if (savedType === 'bakery' || savedType === 'restaurant') {
        setBusinessType(savedType);
      }
    }
  }, [setLanguage, navigate]);

  const goToCatalog = () => {
    navigate('/catalog');
  };

  return (
    <div className="min-h-screen bg-white text-right rtl" dir="rtl">
      <div className="absolute top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>
      <MobileNavigation />
      <CookieConsent />
      <Hero />
      <div className="container mx-auto px-4">
        <BeforeAfterGallery />
        <motion.div 
          className="flex justify-center py-6 md:py-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            onClick={goToCatalog}
            className="bg-[#8B1E3F] hover:bg-[#8B1E3F]/90 text-white text-lg px-6 py-3 md:px-8 md:py-4 rounded-md shadow-lg flex items-center gap-2"
          >
            לקטלוג התמונות המלא
          </Button>
        </motion.div>
        <Benefits />
        <UseCases />
        <PricingPackages />
        <Process />
        <FAQ />
        <ContactForm />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
