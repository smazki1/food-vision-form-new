
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface VisualStyle {
  id: string;
  name: string;
  prompt_fragment: string;
}

interface VisualStyleGridProps {
  value: string;
  onChange: (value: string) => void;
}

export const VisualStyleGrid: React.FC<VisualStyleGridProps> = ({
  value,
  onChange,
}) => {
  const [styles, setStyles] = useState<VisualStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch styles from the visual_styles table
        // Using type assertion since visual_styles table is new and not in generated types yet
        const { data, error: fetchError } = await supabase
          .from('visual_styles' as any)
          .select('id, name, prompt_fragment')
          .order('name');
        
        if (fetchError) {
          console.error('Error fetching visual styles:', fetchError);
          setError('Failed to load visual styles');
          
          // Fallback to hardcoded styles if database query fails
          const fallbackStyles = [
            { id: '1', name: 'Magazine Shoot', prompt_fragment: 'professional food photography, magazine style, vibrant colors, sharp focus, high-end restaurant presentation' },
            { id: '2', name: 'Rustic Vibe', prompt_fragment: 'rustic wooden table, natural lighting, cozy atmosphere, artisanal presentation, warm tones' },
            { id: '3', name: 'Clean White', prompt_fragment: 'clean white background, minimal styling, product photography, bright lighting, professional' },
            { id: '4', name: 'Social Media', prompt_fragment: 'Instagram-worthy, trendy plating, colorful background, appealing to young audience' },
            { id: '5', name: 'Luxury Fine Dining', prompt_fragment: 'elegant plating, sophisticated presentation, fine dining atmosphere, premium quality' },
            { id: '6', name: 'Street Food Style', prompt_fragment: 'casual presentation, authentic street food vibe, vibrant colors, appetizing close-up' }
          ];
          setStyles(fallbackStyles);
        } else {
          // Successfully fetched from database
          // Cast data to proper type since it's not in generated types yet
          const typedData = data as unknown as VisualStyle[];
          setStyles(typedData || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching visual styles:', err);
        setError('An unexpected error occurred');
        // Use fallback styles on any error
        const fallbackStyles = [
          { id: '1', name: 'Magazine Shoot', prompt_fragment: 'professional food photography, magazine style, vibrant colors, sharp focus, high-end restaurant presentation' },
          { id: '2', name: 'Rustic Vibe', prompt_fragment: 'rustic wooden table, natural lighting, cozy atmosphere, artisanal presentation, warm tones' },
          { id: '3', name: 'Clean White', prompt_fragment: 'clean white background, minimal styling, product photography, bright lighting, professional' },
          { id: '4', name: 'Social Media', prompt_fragment: 'Instagram-worthy, trendy plating, colorful background, appealing to young audience' },
          { id: '5', name: 'Luxury Fine Dining', prompt_fragment: 'elegant plating, sophisticated presentation, fine dining atmosphere, premium quality' },
          { id: '6', name: 'Street Food Style', prompt_fragment: 'casual presentation, authentic street food vibe, vibrant colors, appetizing close-up' }
        ];
        setStyles(fallbackStyles);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          בחר סגנון ויזואלי אחד שמתאים למסעדה שלך
        </p>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">טוען סגנונות...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        בחר סגנון ויזואלי אחד שמתאים למסעדה שלך
      </p>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            שימוש בסגנונות ברירת מחדל (לא ניתן לטעון מבסיס הנתונים)
          </p>
        </div>
      )}

      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {styles.map((style) => (
          <div key={style.id} className="space-y-2">
            <div className="relative">
              <div className="w-[150px] h-[150px] bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center border-2 border-orange-200">
                <span className="text-orange-600 font-medium text-sm text-center px-2">
                  {style.name}
                </span>
              </div>
              <div className="absolute bottom-2 right-2">
                <RadioGroupItem
                  value={style.name}
                  id={style.id}
                  className="bg-white"
                />
              </div>
            </div>
            <Label htmlFor={style.id} className="text-center block">
              {style.name}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
