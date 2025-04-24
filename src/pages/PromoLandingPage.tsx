import React from "react";
import { Link } from "react-router-dom";
import GalleryCarousel from "@/components/promo/GalleryCarousel";

const PromoLandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-right rtl" dir="rtl">
      {/* Hero Section - Updated with new background and improved styling */}
      <section 
        className="relative h-screen flex items-center justify-center text-white bg-cover bg-center transition-all duration-300"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('/lovable-uploads/c50a1c5c-2fa9-4fdc-aa84-00665a402a8e.png')"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-center z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 leading-tight">
            תמונות מרהיבות למסעדות - בלי צלם,<br className="hidden sm:block" />
            בלי סטודיו, בלי כאב ראש
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            הטכנולוגיה החדשנית שמאפשרת לבעלי מסעדות ליצור תמונות מקצועיות במחיר שכל עסק יכול להרש��ת לעצמו
          </p>
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg text-white bg-[#f97316] hover:bg-[#f97316]/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            קבל דוגמא מותאמת למסעדה שלך
          </Link>
        </div>
      </section>

      {/* Gallery Section */}
      <GalleryCarousel />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16">
        {/* Benefits Section - Enhanced cards with shadows and hover effects */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">יתרונות המערכת</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="w-12 h-12 bg-[#ea384c]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <div className="w-8 h-8 bg-[#ea384c] rounded-full flex items-center justify-center text-white">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{benefit.title}</h3>
                <p className="text-gray-600 text-center">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section - Enhanced with featured plan */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">חבילות מחירים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 
                  ${index === 1 
                    ? 'border-2 border-[#f97316] shadow-lg hover:shadow-xl scale-105 relative' 
                    : 'border border-gray-200 shadow-md hover:shadow-lg'
                  }`}
              >
                {index === 1 && (
                  <span className="absolute -top-4 right-1/2 transform translate-x-1/2 bg-[#f97316] text-white px-4 py-1 rounded-full text-sm">
                    הכי משתלם
                  </span>
                )}
                <h3 className="text-xl font-semibold mb-4">{plan.title}</h3>
                <p className="text-3xl font-bold mb-6">₪{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[#f97316]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section - Enhanced form */}
        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">רוצים לשמוע עוד?</h2>
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg text-white bg-[#f97316] hover:bg-[#f97316]/90 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
          >
            צור קשר עכשיו
          </Link>
        </section>
      </main>
    </div>
  );
};

const benefits = [
  {
    title: "חיסכון של עד 80%",
    description: "מחיר משתלם במיוחד לעומת צילום מקצועי"
  },
  {
    title: "זמינות מיידית",
    description: "קבלת התמונות תוך 24 שעות"
  },
  {
    title: "איכות מקצועית",
    description: "תוצאות ברמה של צלם מקצועי"
  }
];

const pricingPlans = [
  {
    title: "חבילה בסיסית",
    price: "199",
    features: ["10 תמונות", "עיבוד בסיסי", "תמיכה במייל"]
  },
  {
    title: "חבילה מקצועית",
    price: "399",
    features: ["25 תמונות", "עיבוד מתקדם", "תמיכה טלפונית"]
  },
  {
    title: "חבילה עסקית",
    price: "899",
    features: ["60 תמונות", "עיבוד פרימיום", "תמיכה VIP"]
  }
];

export default PromoLandingPage;
