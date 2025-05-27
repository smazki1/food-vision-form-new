import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { toast } from 'sonner';

interface Dish {
  id: string;
  name: string;
  description: string;
  image_url: string;
  type: 'dish' | 'cocktail' | 'drink';
}

export function DishesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { clientId, loading: authLoading, initialized } = useUnifiedAuth();

  useEffect(() => {
    async function fetchAllDishes() {
      if (authLoading || !initialized) {
        console.log("[DishesPage] Auth loading or not initialized, skipping fetch.");
        setLoading(true);
        return;
      }

      if (!clientId) {
        console.log("[DishesPage] No clientId available after auth initialization");
        setLoading(false);
        setDishes([]);
        return;
      }

      console.log("[DishesPage] Fetching all items for clientId:", clientId);
      setLoading(true);

      try {
        const dishesPromise = supabase
          .from('dishes')
          .select('dish_id, name, description, reference_image_urls')
          .eq('client_id', clientId);

        const cocktailsPromise = supabase
          .from('cocktails')
          .select('cocktail_id, name, description, reference_image_urls')
          .eq('client_id', clientId);

        const drinksPromise = supabase
          .from('drinks')
          .select('drink_id, name, description, reference_image_urls')
          .eq('client_id', clientId);

        const [dishesResult, cocktailsResult, drinksResult] = await Promise.all([
          dishesPromise,
          cocktailsPromise,
          drinksPromise
        ]);

        console.log("[DishesPage] Query results:", {
          dishes: dishesResult,
          cocktails: cocktailsResult,
          drinks: drinksResult
        });

        const allItems: Dish[] = [];

        if (dishesResult.data) {
          dishesResult.data.forEach(dish => {
            allItems.push({
              id: dish.dish_id,
              name: dish.name,
              description: dish.description || 'מנה',
              image_url: dish.reference_image_urls?.[0] || '',
              type: 'dish'
            });
          });
        }

        if (cocktailsResult.data) {
          cocktailsResult.data.forEach(cocktail => {
            allItems.push({
              id: cocktail.cocktail_id,
              name: cocktail.name,
              description: cocktail.description || 'קוקטייל',
              image_url: cocktail.reference_image_urls?.[0] || '',
              type: 'cocktail'
            });
          });
        }

        if (drinksResult.data) {
          drinksResult.data.forEach(drink => {
            allItems.push({
              id: drink.drink_id,
              name: drink.name,
              description: drink.description || 'משקה',
              image_url: drink.reference_image_urls?.[0] || '',
              type: 'drink'
            });
          });
        }

        console.log("[DishesPage] Total items found:", allItems.length);
        setDishes(allItems);

        let errorOccurred = false;
        if (dishesResult.error) {
          console.error('[DishesPage] Error fetching dishes:', dishesResult.error);
          errorOccurred = true;
        }
        if (cocktailsResult.error) {
          console.error('[DishesPage] Error fetching cocktails:', cocktailsResult.error);
          errorOccurred = true;
        }
        if (drinksResult.error) {
          console.error('[DishesPage] Error fetching drinks:', drinksResult.error);
          errorOccurred = true;
        }
        if (errorOccurred) {
            toast.error('אירעה שגיאה חלקית בטעינת הפריטים.');
        }

      } catch (error) {
        console.error('[DishesPage] Exception fetching items:', error);
        toast.error('שגיאה בטעינת הפריטים. נסו שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllDishes();
  }, [clientId, authLoading, initialized]);

  const filteredDishes = dishes.filter(dish =>
    dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemTypeDisplay = (type: string) => {
    switch (type) {
      case 'dish': return 'מנה';
      case 'cocktail': return 'קוקטייל';
      case 'drink': return 'משקה';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex justify-center items-center min-h-screen bg-rose-50">
        טוען מנות...
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-rose-50 pb-20">
      <div className="sticky top-0 bg-rose-50 shadow-sm z-10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">המנות שלי</h1>
        <Link to="/customer/upload" className="text-primary p-2">
          <Plus size={24} />
        </Link>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="חיפוש מנות, קוקטיילים, משקאות..."
            className="w-full pr-10 pl-4 py-2 bg-rose-100 rounded-lg border-transparent focus:border-rose-300 focus:ring-rose-300 text-gray-700 placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        {filteredDishes.length === 0 && !loading ? (
          <div className="text-center text-gray-500 py-10">
            <p>לא נמצאו פריטים התואמים את החיפוש או שלא הוספת עדיין פריטים.</p>
            <p>רוצה להוסיף פריט חדש? <Link to="/customer/upload" className="text-primary hover:underline">לחץ כאן</Link></p>
            {!clientId && !authLoading && initialized && (
                 <p className="text-sm text-red-500 mt-2">מידע לקוח אינו זמין כעת. נסה לרענן את הדף.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <Card key={dish.id} className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105">
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    src={dish.image_url || '/placeholder-image.webp'} 
                    alt={dish.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => (e.currentTarget.src = '/placeholder-image.webp')}
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 truncate" title={dish.name}>{dish.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 min-h-[40px] overflow-hidden text-ellipsis line-clamp-2" title={dish.description}>
                    {dish.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ 
                      dish.type === 'dish' ? 'bg-green-100 text-green-700' : 
                      dish.type === 'cocktail' ? 'bg-purple-100 text-purple-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {getItemTypeDisplay(dish.type)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
