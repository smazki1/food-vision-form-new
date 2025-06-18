import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, Move } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Define dashboard sections for configuration
export type DashboardSection = {
  id: string;
  title: string;
  visible: boolean;
  defaultOrder: number;
  order: number;
};

export type DashboardSettings = {
  sections: DashboardSection[];
};

export const defaultSections: DashboardSection[] = [
  { id: "kpi", title: "מדדים עיקריים", visible: true, defaultOrder: 0, order: 0 },
  { id: "alerts", title: "התראות דחופות", visible: true, defaultOrder: 1, order: 1 },
  { id: "leadFunnel", title: "משפך לידים", visible: true, defaultOrder: 2, order: 2 },
  { id: "leadSource", title: "לידים לפי מקור", visible: true, defaultOrder: 3, order: 3 },
  { id: "clientsOverview", title: "סקירת לקוחות", visible: true, defaultOrder: 4, order: 4 },
  { id: "clientSubmissionStats", title: "סטטיסטיקות הגשות לקוחות", visible: true, defaultOrder: 5, order: 5 },
  { id: "submissionQueue", title: "מנות בעיבוד", visible: true, defaultOrder: 6, order: 6 },
  { id: "editorPerformance", title: "ביצועי עורכים", visible: true, defaultOrder: 7, order: 7 },
  { id: "packageUtilization", title: "ניצול חבילות", visible: true, defaultOrder: 8, order: 8 }
];

const DASHBOARD_SETTINGS_KEY = "food-vision-admin-dashboard-settings";

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>({ sections: [...defaultSections] });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as Partial<DashboardSettings>; // Type assertion
        const savedSectionsArray = Array.isArray(parsedSettings.sections) ? parsedSettings.sections : [];

        const sectionIdToSavedSectionMap = new Map<string, Partial<DashboardSection>>(
          savedSectionsArray.map((s: Partial<DashboardSection>) => [s.id || '', s])
        );

        const mergedSections: DashboardSection[] = defaultSections.map(defaultSection => {
          const savedSection = sectionIdToSavedSectionMap.get(defaultSection.id);
          return {
            id: defaultSection.id,
            title: defaultSection.title,
            visible: defaultSection.visible, // Prioritize default visibility from code
            defaultOrder: defaultSection.defaultOrder,
            order: (savedSection && typeof savedSection.order === 'number') ? savedSection.order : defaultSection.order,
          };
        });

        mergedSections.sort((a, b) => a.order - b.order);
        setSettings({ sections: mergedSections });

      } catch (e) {
        console.error("Error parsing dashboard settings or invalid structure", e);
        const sortedDefaultSections = [...defaultSections].sort((a,b) => a.order - b.order);
        setSettings({ sections: sortedDefaultSections });
      }
    } else {
      const sortedDefaultSections = [...defaultSections].sort((a,b) => a.order - b.order);
      setSettings({ sections: sortedDefaultSections });
    }
  }, []);

  const saveSettings = (newSettings: DashboardSettings) => {
    setSettings(newSettings);
    localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const newSections = settings.sections.map(section =>
      section.id === sectionId ? { ...section, visible: !section.visible } : section
    );
    saveSettings({ sections: newSections });
  };

  const moveSectionUp = (sectionId: string) => {
    const sectionIndex = settings.sections.findIndex(section => section.id === sectionId);
    if (sectionIndex <= 0) return;

    const newSections = [...settings.sections];
    const temp = newSections[sectionIndex].order;
    newSections[sectionIndex].order = newSections[sectionIndex - 1].order;
    newSections[sectionIndex - 1].order = temp;
    
    // Sort by order
    newSections.sort((a, b) => a.order - b.order);
    
    saveSettings({ sections: newSections });
  };

  const moveSectionDown = (sectionId: string) => {
    const sectionIndex = settings.sections.findIndex(section => section.id === sectionId);
    if (sectionIndex >= settings.sections.length - 1) return;

    const newSections = [...settings.sections];
    const temp = newSections[sectionIndex].order;
    newSections[sectionIndex].order = newSections[sectionIndex + 1].order;
    newSections[sectionIndex + 1].order = temp;
    
    // Sort by order
    newSections.sort((a, b) => a.order - b.order);
    
    saveSettings({ sections: newSections });
  };

  const resetSettings = () => {
    saveSettings({ sections: [...defaultSections] });
    toast.success("הגדרות הדאשבורד אופסו בהצלחה");
  };

  return {
    settings,
    toggleSectionVisibility,
    moveSectionUp,
    moveSectionDown,
    resetSettings,
  };
}

export function DashboardSettings() {
  const [open, setOpen] = useState(false);
  const {
    settings,
    toggleSectionVisibility,
    moveSectionUp,
    moveSectionDown,
    resetSettings,
  } = useDashboardSettings();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">הגדרות דאשבורד</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>התאמה אישית של הדאשבורד</DialogTitle>
          <DialogDescription>
            התאם את הדאשבורד לצרכים שלך על ידי שינוי הגדרות התצוגה.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <h3 className="font-medium mb-1">הצגת מדדים</h3>
          <div className="space-y-3 mb-4">
            {settings.sections.sort((a, b) => a.order - b.order).map(section => (
              <div key={section.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => moveSectionUp(section.id)}
                    disabled={section.order === 0}
                  >
                    <Move className="h-4 w-4 rotate-90" />
                    <span className="sr-only">הזז למעלה</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => moveSectionDown(section.id)}
                    disabled={section.order === settings.sections.length - 1}
                  >
                    <Move className="h-4 w-4 -rotate-90" />
                    <span className="sr-only">הזז למטה</span>
                  </Button>
                  <Label htmlFor={`section-${section.id}`} className="mr-1">
                    {section.title}
                  </Label>
                </div>
                <Switch
                  id={`section-${section.id}`}
                  checked={section.visible}
                  onCheckedChange={() => toggleSectionVisibility(section.id)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              סגור
            </Button>
            <Button variant="default" onClick={resetSettings}>
              אפס הגדרות
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
