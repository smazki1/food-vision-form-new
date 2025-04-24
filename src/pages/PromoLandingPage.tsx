
import React from "react";
import { Link } from "react-router-dom";

const PromoLandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-right rtl" dir="rtl">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            תמונות מקצועיות למסעדות - בלי צלם, בלי סטודיו, בלי כאב ראש
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            הטכנולוגיה החדשנית שמאפשרת לבעלי מסעדות ליצור תמונות מקצועיות במחיר שכל עסק יכול להרשות לעצמו
          </p>
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            התחל עכשיו
          </Link>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">יתרונות המערכת</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">חיסכון של עד 80%</h3>
              <p>מחיר משתלם במיוחד לעומת צילום מקצועי</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">זמינות מיידית</h3>
              <p>קבלת התמונות תוך 24 שעות</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">איכות מקצועית</h3>
              <p>תוצאות ברמה של צלם מקצועי</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">חבילות מחירים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">חבילה בסיסית</h3>
              <p className="text-3xl font-bold mb-4">₪199</p>
              <ul className="space-y-2">
                <li>10 תמונות</li>
                <li>עיבוד בסיסי</li>
                <li>תמיכה במייל</li>
              </ul>
            </div>
            <div className="p-6 border rounded-lg border-primary">
              <h3 className="text-xl font-semibold mb-4">חבילה מקצועית</h3>
              <p className="text-3xl font-bold mb-4">₪399</p>
              <ul className="space-y-2">
                <li>25 תמונות</li>
                <li>עיבוד מתקדם</li>
                <li>תמיכה טלפונית</li>
              </ul>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-4">חבילה עסקית</h3>
              <p className="text-3xl font-bold mb-4">₪899</p>
              <ul className="space-y-2">
                <li>60 תמונות</li>
                <li>עיבוד פרימיום</li>
                <li>תמיכה VIP</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">רוצים לשמוע עוד?</h2>
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            צור קשר עכשיו
          </Link>
        </section>
      </main>
    </div>
  );
};

export default PromoLandingPage;
