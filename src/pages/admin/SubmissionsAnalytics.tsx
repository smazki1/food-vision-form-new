
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SubmissionsAnalytics: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ניתוח הגשות</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>סה"כ הגשות</CardTitle>
            <CardDescription>מספר הגשות כולל החודש</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>הגשות בעיבוד</CardTitle>
            <CardDescription>הגשות שנמצאות כרגע בעיבוד</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>הגשות הושלמו</CardTitle>
            <CardDescription>הגשות שהושלמו החודש</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>גרף התקדמות</CardTitle>
          <CardDescription>התקדמות הגשות לאורך זמן</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            גרף יופיע כאן בעתיד
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionsAnalytics;
