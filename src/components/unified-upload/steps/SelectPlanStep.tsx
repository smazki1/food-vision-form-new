import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface SelectPlanStepProps {
  onNext: (data: any) => void;
}

export const SelectPlanStep: React.FC<SelectPlanStepProps> = ({ onNext }) => {
  const [activeTab, setActiveTab] = React.useState<string>('התחל עכשיו');

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Custom Tabs */}
        <div className="flex w-full">
          <button
            onClick={() => setActiveTab('התחל עכשיו')}
            className={`flex-1 py-6 sm:py-7 px-4 sm:px-8 text-center font-heebo font-bold text-base sm:text-lg md:text-xl transition-all duration-300 relative ${
              activeTab === 'התחל עכשיו'
                ? 'text-primary-FV bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50/80'
            }`}
            style={{ minWidth: '160px' }}
          >
            <span className="relative z-10 whitespace-nowrap">התחל עכשיו</span>
            {activeTab === 'התחל עכשיו' && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-orange-500 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('טעימה מהשירות')}
            className={`flex-1 py-6 sm:py-7 px-4 sm:px-8 text-center font-heebo font-bold text-base sm:text-lg md:text-xl transition-all duration-300 relative ${
              activeTab === 'טעימה מהשירות'
                ? 'text-primary-FV bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50/80'
            }`}
            style={{ minWidth: '160px' }}
          >
            <span className="relative z-10 whitespace-nowrap">טעימה מהשירות</span>
            {activeTab === 'טעימה מהשירות' && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-orange-500 rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            {activeTab === 'התחל עכשיו' ? 'שדרג את תמונות המנות שלך ✨' : 'טעימה מהשירות'}
          </h2>

          {activeTab === 'טעימה מהשירות' && (
            <div className="space-y-8">
              <div className="relative p-6 sm:p-8 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-2xl">
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-secondary-FV to-orange-400 text-white text-sm px-4 py-1.5 rounded-full font-inter font-semibold shadow-sm">
                    חינם לחלוטין
                  </span>
                </div>
                
                <div className="mt-8 space-y-5">
                  <div className="flex items-start">
                    <span className="text-lg sm:text-xl font-medium">3 תמונות מקצועיות בחינם</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-lg sm:text-xl font-medium">עיבוד מהיר ברמה גבוהה</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-lg sm:text-xl font-medium">תוצאות מרהיבות למנות שלך</span>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <p className="text-sm text-gray-600">עיבוד מחיר ברמה גבוהה</p>
                  <Button 
                    onClick={() => onNext({ plan: 'free' })}
                    className="w-full py-5 text-base sm:text-lg bg-gradient-to-r from-primary-FV to-primary-FV-dark text-white font-bold"
                  >
                    התחל/י עכשיו
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'התחל עכשיו' && (
            <div className="space-y-6">
              <p className="text-center text-gray-600 mb-8">
                קבלו תמונות מקצועיות ומרהיבות למנות שלכם בקלות ובמהירות
              </p>
              
              <Button 
                onClick={() => onNext({ plan: 'regular' })}
                className="w-full py-5 text-base sm:text-lg bg-gradient-to-r from-primary-FV to-primary-FV-dark text-white font-bold"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                המשך לשלב הבא
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectPlanStep; 