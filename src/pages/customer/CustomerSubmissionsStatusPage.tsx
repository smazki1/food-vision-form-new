
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import SubmissionCard from '@/components/customer/SubmissionCard';
import { Clock, CheckCircle, RefreshCw, PenSquare, Package, Star } from 'lucide-react';

// Mock data as functionality is out of scope for this task
const mockSubmissions = [
  { id: '1', name: 'ספייסי צ\'יקן בורגר', category: 'מנה עיקרית', status: 'מוכן לבדיקה', variations: 2, imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2072&auto=format&fit=crop' },
  { id: '2', name: 'גורמה ביף בורגר', category: 'מנה עיקרית', status: 'בתהליך', variations: 1, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1998&auto=format&fit=crop' },
  { id: '3', name: 'צ\'יזבורגר קלאסי', category: 'מנה עיקרית', status: 'הושלם', variations: 1, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1965&auto=format&fit=crop' },
  { id: '4', name: 'בורגר צמחוני', category: 'צמחוני', status: 'מוכן לבדיקה', variations: 1, imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=2069&auto=format&fit=crop' },
  { id: '5', name: 'BBQ בייקון בורגר', category: 'מנה עיקרית', status: 'בתהליך', variations: 1, imageUrl: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=1974&auto=format&fit=crop' },
  { id: '6', name: 'פיש בורגר דלוקס', category: 'דגים', status: 'דרוש תיקון', variations: 1, imageUrl: 'https://images.unsplash.com/photo-1572441716334-3677fc42d9f4?q=80&w=1974&auto=format&fit=crop' },
];

const statusConfig: Record<string, { style: string; hebrew: string; icon: React.ReactNode }> = {
    'מוכן לבדיקה': { style: 'bg-blue-100 text-blue-800', hebrew: 'מוכן לבדיקה', icon: <PenSquare className="w-3 h-3" /> },
    'בתהליך': { style: 'bg-yellow-100 text-yellow-800', hebrew: 'בתהליך', icon: <Clock className="w-3 h-3" /> },
    'הושלם': { style: 'bg-green-100 text-green-800', hebrew: 'הושלם', icon: <CheckCircle className="w-3 h-3" /> },
    'דרוש תיקון': { style: 'bg-orange-100 text-orange-800', hebrew: 'דרוש תיקון', icon: <RefreshCw className="w-3 h-3" /> },
};

export const getStatusIconAndStyle = (status: string | null) => {
    return statusConfig[status || ''] || { style: 'bg-gray-100 text-gray-800', hebrew: 'לא ידוע', icon: <Star className="w-3 h-3" /> };
};

export const getItemTypeName = (itemType: string | null) => {
    const types: Record<string, string> = {
      dish: 'מנה',
      cocktail: 'קוקטייל',
      drink: 'משקה',
    };
    return types[itemType || ''] || 'פריט';
};

const CustomerSubmissionsStatusPage = () => {
  return (
    <div dir="rtl" className="bg-slate-50 min-h-screen">
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Avatar className="w-16 h-16 border-2 border-primary-FV">
            <AvatarImage src="https://github.com/shadcn.png" alt="Sophia Carter" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">סופיה כרטר</h1>
            <p className="text-muted-foreground">מסעדת הפאר</p>
          </div>
        </header>

        {/* Package Info */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-primary-FV" />
              <CardTitle>פרטי חבילה</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">סוג חבילה</p>
              <p className="font-bold text-lg">חבילת פרימיום</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ניצול</p>
              <p className="font-bold text-lg">7 מתוך 10 מנות</p>
              <Progress value={70} className="mt-2 h-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">תוקף</p>
              <p className="font-bold text-lg">31 בדצמבר, 2025</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Dishes Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">המנות שלכם</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockSubmissions.map(sub => (
              <SubmissionCard
                key={sub.id}
                id={sub.id}
                imageUrl={sub.imageUrl}
                name={sub.name}
                category={sub.category}
                status={sub.status}
                statusStyle={statusConfig[sub.status]?.style || ''}
                variations={sub.variations}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerSubmissionsStatusPage;
