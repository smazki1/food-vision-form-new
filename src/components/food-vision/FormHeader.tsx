
import React from "react";

const FormHeader: React.FC = () => {
  return (
    <header className="mb-8 text-center py-4 rounded-lg" style={{
      background: 'linear-gradient(90deg, #F97316 0%, #ea384c 100%)'
    }}>
      <h1 className="text-3xl font-bold text-white">פוד-ויז'ן AI</h1>
      <p className="text-white/90 mt-2">
        תמונות מרהיבות למסעדות בטכנולוגיית AI
      </p>
    </header>
  );
};

export default FormHeader;
