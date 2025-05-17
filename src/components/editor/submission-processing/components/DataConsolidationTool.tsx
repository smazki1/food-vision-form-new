
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const DataConsolidationTool: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    details?: any;
  } | null>(null);

  const runConsolidation = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('consolidate-demo-data');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setResult(data);
      
      // Show toast notification based on result
      if (data.success) {
        toast({
          title: "איחוד נתונים הושלם",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "שגיאה באיחוד נתונים",
          description: data.error,
          variant: "destructive", 
        });
      }
    } catch (err) {
      console.error("Error running consolidation:", err);
      setResult({
        success: false,
        error: err.message || 'An unknown error occurred'
      });
      
      toast({
        title: "שגיאה באיחוד נתונים",
        description: err.message || 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>איחוד נתונים למשתמש דמו</CardTitle>
        <CardDescription>
          כלי זה יאחד את כל הנתונים הקיימים תחת חשבון לקוח דמו אחד ויקשר אותם לחבילת בדיקות
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col gap-6">
          <p>
            הכלי יבצע את הפעולות הבאות:
          </p>
          <ol className="list-decimal list-inside space-y-2 rtl:pr-4">
            <li>יוודא שקיים משתמש עם האימייל balanga@demo.com</li>
            <li>יצור או יעדכן רשומת לקוח אחת מרכזית עבור "חוף בלנגה - דמו"</li>
            <li>יוודא קיום חבילת טסט "חבילת טסט של לקוח ראשון"</li>
            <li>יאחד את כל המנות, הקוקטיילים והמשקאות תחת הלקוח המרכזי</li>
            <li>ייצור רשומות submission עבור כל הפריטים</li>
            <li>יעדכן את מספר המנות הנותרות בהתאם</li>
          </ol>
          
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className={`mt-4 ${result.success ? "border-green-500 bg-green-50" : ""}`}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "הצלחה" : "שגיאה"}</AlertTitle>
              <AlertDescription>
                {result.success ? result.message : result.error}
                
                {result.success && result.details && (
                  <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={runConsolidation} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              מעבד...
            </>
          ) : (
            "הפעל איחוד נתונים"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataConsolidationTool;
