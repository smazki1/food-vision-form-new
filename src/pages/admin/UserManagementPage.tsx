
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const UserManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          הוסף משתמש
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>סה"כ משתמשים</CardTitle>
            <CardDescription>מספר משתמשים במערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>משתמשים פעילים</CardTitle>
            <CardDescription>משתמשים שהתחברו השבוע</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>מנהלים</CardTitle>
            <CardDescription>מספר מנהלי מערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>רשימת משתמשים</CardTitle>
          <CardDescription>כל המשתמשים במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            טבלת משתמשים תופיע כאן בעתיד
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;
