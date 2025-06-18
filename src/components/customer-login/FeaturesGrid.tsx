
import { Check, Award, Clock, Sparkles } from 'lucide-react';

const FeaturesGrid = () => {
  const features = [
    { icon: Check, text: "3-5 מנות נבחרות מהתפריט", color: "bg-[#8b1e3f]" },
    { icon: Award, text: "10 תמונות איכותיות מוכנות לפרסום", color: "bg-[#f3752b]" },
    { icon: Clock, text: "מסירה תוך 48 שעות", color: "bg-[#8b1e3f]" },
    { icon: Sparkles, text: "זיכוי מלא לחבילה מתקדמת", color: "bg-[#f3752b]" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {features.map((feature, index) => (
        <div key={index} className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 rounded-2xl p-5 text-center hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
          <div className={`${feature.color} rounded-full p-3 mx-auto mb-4 w-fit group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            <feature.icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-slate-700 font-semibold leading-relaxed">{feature.text}</span>
        </div>
      ))}
    </div>
  );
};

export default FeaturesGrid;
