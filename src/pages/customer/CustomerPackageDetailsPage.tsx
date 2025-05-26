import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useClientPackage } from '@/hooks/useClientPackage';
import { ShieldCheck, Package as PackageIcon, Zap, HelpCircle } from 'lucide-react';

const CustomerPackageDetailsPage: React.FC = () => {
  const { packageName, remainingDishes, totalDishes } = useClientPackage();

  // Placeholder for more detailed package features or upgrade options
  const packageFeatures = [
    { id: 1, text: "ניהול הגשות מתקדם", icon: <ShieldCheck className="w-5 h-5 text-green-500" /> },
    { id: 2, text: `סה"כ ${totalDishes} מנות בחבילה`, icon: <PackageIcon className="w-5 h-5 text-blue-500" /> },
    { id: 3, text: "תמיכה מהירה", icon: <Zap className="w-5 h-5 text-yellow-500" /> },
  ];

  return (
    <div dir="rtl" className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="shadow-xl">
        <CardHeader className="text-center bg-gray-50 p-6 rounded-t-lg">
          <div className="w-16 h-16 mx-auto bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4">
            <PackageIcon size={32} />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">פרטי החבילה שלכם/ן</CardTitle>
          {packageName && <CardDescription className="text-lg text-gray-600 mt-1">{packageName}</CardDescription>}
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-primary/10 p-6 rounded-lg text-center">
              <p className="text-5xl font-bold text-primary">{remainingDishes}</p>
              <p className="text-md text-gray-700">מנות נותרו</p>
            </div>
            <div className="bg-secondary/20 p-6 rounded-lg text-center">
              <p className="text-5xl font-bold text-secondary-foreground">{totalDishes}</p>
              <p className="text-md text-gray-700">סה"כ מנות בחבילה</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mb-4">מה כלול בחבילה:</h3>
          <ul className="space-y-3 mb-8">
            {packageFeatures.map(feature => (
              <li key={feature.id} className="flex items-center text-gray-600">
                {feature.icon}
                <span className="mr-3">{feature.text}</span>
              </li>
            ))}
          </ul>
          
          <div className="text-center space-y-4">
            <Button size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700">
              שדרג חבילה
            </Button>
            <p className="text-sm text-muted-foreground">
              זקוקים/ות לעזרה או מידע נוסף? <Link to="/contact-support" className="text-primary hover:underline">צרו קשר עם התמיכה</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPackageDetailsPage; 