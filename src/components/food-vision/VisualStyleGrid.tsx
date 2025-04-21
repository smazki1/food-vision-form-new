
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface VisualStyle {
  style_id: string;
  style_name: string;
  image_url: string;
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

  useEffect(() => {
    const fetchStyles = async () => {
      const { data, error } = await supabase
        .from('visual_styles')
        .select('*');
      
      if (error) {
        console.error('Error fetching visual styles:', error);
        return;
      }

      setStyles(data);
    };

    fetchStyles();
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        בחר סגנון ויזואלי אחד שמתאים למסעדה שלך
      </p>

      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {styles.map((style) => (
          <div key={style.style_id} className="space-y-2">
            <div className="relative">
              <img
                src={style.image_url}
                alt={style.style_name}
                className="w-[150px] h-[150px] object-cover rounded-lg"
              />
              <div className="absolute bottom-2 right-2">
                <RadioGroupItem
                  value={style.style_name}
                  id={style.style_id}
                  className="bg-white"
                />
              </div>
            </div>
            <Label htmlFor={style.style_id} className="text-center block">
              {style.style_name}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
