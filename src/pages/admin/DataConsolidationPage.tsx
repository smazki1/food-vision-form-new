
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload } from 'lucide-react';

const DataConsolidationPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">איחוד נתונים</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ייצא נתונים</CardTitle>
            <CardDescription>ייצא נתונים מהמערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              ייצא
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>ייבא נתונים</CardTitle>
            <CardDescription>ייבא נתונים למערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              ייבא
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>סנכרון נתונים</CardTitle>
            <CardDescription>סנכרן נתונים בין מערכות</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              סנכרן
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>סטטוס איחוד נתונים</CardTitle>
          <CardDescription>מצב עדכני של איחוד הנתונים</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>לידים</span>
              <span className="text-green-600">מסונכרן</span>
            </div>
            <div className="flex justify-between items-center">
              <span>לקוחות</span>
              <span className="text-green-600">מסונכרן</span>
            </div>
            <div className="flex justify-between items-center">
              <span>הגשות</span>
              <span className="text-green-600">מסונכרן</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataConsolidationPage;
