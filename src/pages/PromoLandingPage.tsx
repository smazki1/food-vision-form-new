
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GalleryCarousel } from "@/components/promo/GalleryCarousel";
import { Link } from "react-router-dom";

const PromoLandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-[#8B1E3F] rounded text-white flex items-center justify-center font-bold text-lg mr-2">
              FV
            </div>
            <h1 className="text-xl font-bold">Food Vision</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild className="ml-2">
              <Link to="/login">התחברות</Link>
            </Button>
            <Button asChild>
              <Link to="/food-vision-form">התחל עכשיו</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-[#8B1E3F] text-white">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-4xl font-bold mb-4">
              תמונות איכותיות למנות המסעדה שלך
            </h2>
            <p className="text-xl mb-6">
              פתרון מלא לצילום ועריכת תמונות מקצועיות למנות, קוקטיילים, משקאות
              ובישולים מיוחדים
            </p>
            <Button size="lg" className="bg-white text-[#8B1E3F] hover:bg-gray-100" asChild>
              <Link to="/food-vision-form">התחל עכשיו</Link>
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-xl">
              <img
                src="/placeholder.svg"
                alt="Food Vision Product"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">היתרונות שלנו</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6" />
                    <path d="m9 9 6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">מהירות ויעילות</h3>
                <p className="text-gray-600">
                  קבלת תמונות מקצועיות ומעוצבות תוך 24 שעות בלבד
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-500"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">איכות מקצועית</h3>
                <p className="text-gray-600">
                  צוות צלמים ועורכים מקצועיים עם ניסיון רב בצילום אוכל
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-purple-500"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">תמיכה ושירות</h3>
                <p className="text-gray-600">
                  ליווי אישי לאורך כל התהליך ואפשרות לתיקונים ללא הגבלה
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            הצצה לעבודות שלנו
          </h2>
          <GalleryCarousel />
          <div className="mt-12 text-center">
            <Button asChild>
              <Link to="/food-vision-form">התחל עכשיו</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#8B1E3F] text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">
            מוכנים לשדרג את התמונות של המסעדה שלכם?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            הצטרפו כעת לשירות Food Vision ותהנו מתמונות מקצועיות, מעוצבות
            ואיכותיות למנות שלכם!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#8B1E3F] hover:bg-gray-100" asChild>
              <Link to="/food-vision-form">התחל עכשיו</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/login">התחבר לחשבונך</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 bg-white rounded text-[#8B1E3F] flex items-center justify-center font-bold text-lg ml-2">
                  FV
                </div>
                <span className="text-white font-bold">Food Vision</span>
              </div>
              <p>© 2023 Food Vision. כל הזכויות שמורות.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <Link to="/food-vision-form" className="hover:text-white">
                התחל עכשיו
              </Link>
              <Link to="/login" className="hover:text-white">
                התחברות לחשבון
              </Link>
              <a href="#" className="hover:text-white">
                מדיניות פרטיות
              </a>
              <a href="#" className="hover:text-white">
                תנאי שימוש
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PromoLandingPage;
