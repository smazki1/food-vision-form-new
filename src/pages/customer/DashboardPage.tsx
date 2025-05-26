import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, Image, ChevronRight } from 'lucide-react';
import { useClientPackage } from '@/hooks/useClientPackage';

export function DashboardPage() {
  const { remainingDishes, totalDishes, packageName } = useClientPackage();

  // TODO: Fetch actual user name
  const userName = "נעמה"; // Placeholder

  return (
    <div className="flex flex-col space-y-6 p-4 pb-20 min-h-screen">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">שלום, {userName}</h1>
      </div>

      {/* Order: 1. Welcome (above), 2. Dish Status, 3. My Gallery */}
      {/* Dish Status (סטטוס מנות) - formerly "צפה במנות שלך" */}
        <Button
          asChild
          variant="outline"
          className="w-full h-12 text-lg"
        >
          <Link to="/customer/submissions">
            <Package className="mr-2 h-5 w-5" />
          סטטוס מנות
          </Link>
        </Button>

      {/* My Gallery (הגלריה שלי) - REMAINS AS IS */}
        <Button
          asChild
          variant="outline"
          className="w-full h-12 text-lg"
        >
          <Link to="/customer/gallery">
            <Image className="mr-2 h-5 w-5" />
            הגלריה שלי
          </Link>
        </Button>

      {/* "הגשת פריטים חדשים" - REMOVED. The current buttons are "סטטוס מנות" and "הגלריה שלי" */}

      {/* Package Card - MOVED TO BOTTOM & REORGANIZED with improved styling */}
      <div className="mt-auto pt-6">
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-xl font-semibold">חבילה נוכחית</h2>
            
            {/* Button centered with responsive width */}
            <Button
              asChild
              className="w-3/4 sm:w-1/2 md:w-2/3 h-11 text-base"
            >
              <Link to="/customer/package-details">
                פרטי החבילה
              </Link>
            </Button>
            
            {/* Package name: more prominent */}
            <p className="text-lg text-slate-700 dark:text-slate-300">{packageName}</p>
            
            {/* Dish details: improved styling */}
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-primary">
                {remainingDishes}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                מנות נותרו מתוך {totalDishes}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 