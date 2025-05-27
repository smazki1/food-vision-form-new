
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/hooks/useClientAuth';
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
  
  const { clientId: clientAuthId } = useClientAuth();
  const { clientId: unifiedClientId } = useUnifiedAuth();
  
  // Use clientId from either source - prefer clientAuth but fallback to unified
  const clientId = clientAuthId || unifiedClientId;

  useEffect(() => {
    async function fetchAllDishes() {
      if (!clientId) {
        console.log("[DishesPage] No clientId available");
        setLoading(false);
        return;
      }

      console.log("[DishesPage] Fetching all dishes for clientId:", clientId);
      setLoading(true);

      try {
        // Fetch all dishes for this client
        const dishesPromise = supabase
          .from('dishes')
          .select('dish_id, name, description, reference_image_urls')
          .eq('client_id', clientId);

        // Fetch all cocktails for this client
        const cocktailsPromise = supabase
          .from('cocktails')
          .select('cocktail_id, name, description, reference_image_urls')
          .eq('client_id', clientId);

        // Fetch all drinks for this client
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

        // Process dishes
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

        // Process cocktails
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

        // Process drinks
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

        if (dishesResult.error) {
          console.error('[DishesPage] Error fetching dishes:', dishesResult.error);
        }
        if (cocktailsResult.error) {
          console.error('[DishesPage] Error fetching cocktails:', cocktailsResult.error);
        }
        if (drinksResult.error) {
          console.error('[DishesPage] Error fetching drinks:', drinksResult.error);
        }

      } catch (error) {
        console.error('[DishesPage] Exception fetching dishes:', error);
        toast.error('שגיאה בטעינת המנות. נסו שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllDishes();
  }, [clientId]);

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

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-rose-50 pb-20">
      <div className="sticky top-0 bg-rose-50 shadow-sm z-10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">מנות</h1>
        <Link to="/customer/new-submission" className="text-primary p-2">
          <Plus size={24} />
        </Link>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="חיפוש מנות..."
            className="w-full pr-10 pl-4 py-2 bg-rose-100 rounded-lg border-transparent focus:border-rose-300 focus:ring-rose-300 text-gray-700 placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">כל הפריטים</h2>
          {!loading && (
            <span className="text-sm text-gray-500">
              {filteredDishes.length} פריטים
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            <p>טוען פריטים...</p>
          </div>
        ) : filteredDishes.length > 0 ? (
          <div className="space-y-3">
            {filteredDishes.map((dish) => (
              <Card
                key={dish.id}
                className="flex items-center p-3 bg-white shadow-sm hover:bg-gray-50 transition-colors"
              >
                <img
                  src={dish.image_url || '/placeholder-dish.svg'}
                  alt={dish.name}
                  className="w-16 h-16 object-cover rounded-md ml-4"
                  onError={(e) => (e.currentTarget.src = '/placeholder-dish.svg')}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{dish.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {getItemTypeDisplay(dish.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{dish.description}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>לא נמצאו פריטים התואמים את החיפוש שלכם/ן.</p>
            {dishes.length === 0 && clientId && (
              <p>עדיין לא הוספתם/ן פריטים.</p>
            )}
            {!clientId && (
              <p>נדרש חיבור לחשבון לקוח לצפייה בפריטים.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
