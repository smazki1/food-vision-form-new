import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Add your translations here
// For a more organized approach, you can put these in separate JSON files
// e.g., public/locales/en/translation.json
const resources = {
  en: {
    translation: {
      "leadsPage.title": "Leads Management",
      "leadsPage.newLead": "New Lead",
      "leadsPage.costsReport": "Costs Report",
      "leadsPage.archivePage": "Archive Page",
      "leadsPage.aiPricingSettings": "AI Pricing Settings",
      "leadsPage.noData": "No lead data available.",
      "leadsPage.noLeadsFound": "No leads found matching your criteria.",
      // Add other translations as needed
    }
  },
  he: {
    translation: {
      "leadsPage.title": "ניהול לידים",
      "leadsPage.newLead": "ליד חדש",
      "leadsPage.costsReport": "דוח עלויות",
      "leadsPage.archivePage": "עמוד ארכיון",
      "leadsPage.aiPricingSettings": "הגדרות תמחור AI",
      "leadsPage.noData": "אין נתוני לידים זמינים.",
      "leadsPage.noLeadsFound": "לא נמצאו לידים התואמים את החיפוש שלך.",
      // Add other translations as needed
    }
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // pass the i18n instance to react-i18next.
  .init({
    resources,
    fallbackLng: 'he', // use Hebrew if detected lng is not available
    debug: process.env.NODE_ENV === 'development', // Enable debug output in development
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    }
  });

export default i18n; 