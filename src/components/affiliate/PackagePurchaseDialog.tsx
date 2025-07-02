import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ExternalLink, Check } from 'lucide-react';
import { PACKAGE_PRICING } from '@/api/affiliateApi';

interface PackageOption {
  type: 'tasting' | 'full_menu' | 'deluxe';
  name: string;
  price: number;
  images: number;
  dishes: number;
  costPerImage: number;
  paymentUrl: string;
  features: string[];
}

const PACKAGE_OPTIONS: PackageOption[] = [
  {
    type: 'tasting',
    name: 'חבילת טעימות',
    price: 550,
    images: 60,
    dishes: 12,
    costPerImage: 9.2,
    paymentUrl: 'https://app.icount.co.il/m/3dab8/c12db4pb2u6863d784a?utm_source=iCount&utm_medium=paypage&utm_campaign=178',
    features: [
      '60 תמונות איכותיות',
      '12 מנות שונות',
      '5 תמונות לכל מנה',
      'עלות לתמונה: 9.2₪'
    ]
  },
  {
    type: 'full_menu',
    name: 'תפריט מלא',
    price: 990,
    images: 150,
    dishes: 30,
    costPerImage: 6.6,
    paymentUrl: 'https://app.icount.co.il/m/2d3e8/c12db4paeu6863d7478?utm_source=iCount&utm_medium=paypage&utm_campaign=174',
    features: [
      '150 תמונות איכותיות',
      '30 מנות שונות',
      '5 תמונות לכל מנה',
      'עלות לתמונה: 6.6₪'
    ]
  },
  {
    type: 'deluxe',
    name: 'חבילת דלוקס',
    price: 1690,
    images: 325,
    dishes: 65,
    costPerImage: 5.2,
    paymentUrl: 'https://app.icount.co.il/m/25524/c12db4paau6863d7126?utm_source=iCount&utm_medium=paypage&utm_campaign=170',
    features: [
      '325 תמונות איכותיות',
      '65 מנות שונות',
      '5 תמונות לכל מנה',
      'עלות לתמונה: 5.2₪'
    ]
  }
];

interface PackagePurchaseDialogProps {
  children: React.ReactNode;
  affiliateId: string;
}

export const PackagePurchaseDialog: React.FC<PackagePurchaseDialogProps> = ({ children, affiliateId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePurchase = (packageType: 'tasting' | 'full_menu' | 'deluxe', basePaymentUrl: string) => {
    const currentDomain = window.location.origin;
    const successUrl = `${currentDomain}/affiliate/purchase-success`;
    
    // Add our success URL as a parameter to the payment URL
    const paymentUrl = `${basePaymentUrl}&success_url=${encodeURIComponent(successUrl)}`;
    
    // Open payment page in new tab
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'tasting':
        return 'secondary';
      case 'full_menu':
        return 'default';
      case 'deluxe':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'tasting':
        return 'border-blue-200 hover:border-blue-300';
      case 'full_menu':
        return 'border-green-200 hover:border-green-300';
      case 'deluxe':
        return 'border-purple-200 hover:border-purple-300 ring-2 ring-purple-100';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">רכישת חבילה חדשה</DialogTitle>
          <DialogDescription className="text-center">
            בחר את החבילה המתאימה לצרכים שלך
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {PACKAGE_OPTIONS.map((pkg) => (
            <Card 
              key={pkg.type} 
              className={`relative transition-all duration-200 hover:shadow-lg ${getCardStyle(pkg.type)}`}
            >
              {pkg.type === 'deluxe' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">הכי פופולרי</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  {pkg.price.toLocaleString()}₪
                </div>
                <CardDescription>
                  עלות לתמונה: {pkg.costPerImage}₪
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handlePurchase(pkg.type, pkg.paymentUrl)}
                    className="w-full"
                    variant={pkg.type === 'deluxe' ? 'default' : 'outline'}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    רכוש עכשיו
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">תהליך רכישת החבילה:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• התשלום מתבצע באמצעות מערכת iCount המאובטחת</li>
                <li>• לאחר התשלום תועבר לעמוד אישור - החבילה ממתינה לאישור</li>
                <li>• מנהל המערכת יקבל את פרטי התשלום ויאשר את החבילה</li>
                <li>• לאחר אישור, החבילה תתווסף לחשבון שלך ותוכל להתחיל להשתמש בה</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 