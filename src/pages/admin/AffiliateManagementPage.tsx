import React, { useState } from 'react';
import { useAffiliates, useCreateAffiliate, useDeleteAffiliate } from '@/hooks/useAffiliate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Mail, Phone, DollarSign, Settings, Trash2, User } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import type { CreateAffiliateForm } from '@/types/affiliate';

const AffiliateManagementPage: React.FC = () => {
  const { data: affiliates, isLoading } = useAffiliates();
  const createAffiliateMutation = useCreateAffiliate();
  const deleteAffiliateMutation = useDeleteAffiliate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAffiliateForm>({
    name: '',
    email: '',
    phone: '',
    commission_rate_tasting: 30,
    commission_rate_full_menu: 25,
    commission_rate_deluxe: 20,
  });

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAffiliateMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        commission_rate_tasting: 30,
        commission_rate_full_menu: 25,
        commission_rate_deluxe: 20,
      });
    } catch (error) {
      console.error('Failed to create affiliate:', error);
    }
  };

  const handleDeleteAffiliate = async (affiliateId: string) => {
    try {
      await deleteAffiliateMutation.mutateAsync(affiliateId);
    } catch (error) {
      console.error('Failed to delete affiliate:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען רשימת שותפים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול שותפים</h1>
          <p className="text-gray-600 mt-1">ניהול ובקרה של מערכת השותפים</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              הוסף שותף חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>צור שותף חדש</DialogTitle>
              <DialogDescription>
                הזן את פרטי השותף החדש. יווצר חשבון התחברות אוטומטית.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAffiliate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="שם השותף"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="050-123-4567"
                />
              </div>
              
              <div className="space-y-3">
                <Label>שיעורי עמלה (%)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="tasting" className="text-sm">טעימות</Label>
                    <Input
                      id="tasting"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.commission_rate_tasting}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_rate_tasting: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="full-menu" className="text-sm">תפריט מלא</Label>
                    <Input
                      id="full-menu"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.commission_rate_full_menu}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_rate_full_menu: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="deluxe" className="text-sm">דלוקס</Label>
                    <Input
                      id="deluxe"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.commission_rate_deluxe}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_rate_deluxe: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createAffiliateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createAffiliateMutation.isPending ? 'יוצר...' : 'צור שותף'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ שותפים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שותפים פעילים</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates?.filter(a => a.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ עמלות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(affiliates?.reduce((sum, a) => sum + a.total_earnings, 0) || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הפניות</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates?.reduce((sum, a) => sum + a.total_referrals, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת שותפים</CardTitle>
          <CardDescription>
            כל השותפים במערכת ונתוני הביצועים שלהם
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates && affiliates.length > 0 ? (
            <div className="space-y-4">
              {affiliates.map((affiliate) => (
                <div
                  key={affiliate.affiliate_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{affiliate.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {affiliate.email}
                        </span>
                        {affiliate.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {affiliate.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{affiliate.total_referrals}</div>
                      <div className="text-xs text-gray-500">הפניות</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{formatCurrency(affiliate.total_earnings)}</div>
                      <div className="text-xs text-gray-500">עמלות</div>
                    </div>
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                      {affiliate.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                            <AlertDialogDescription>
                              פעולה זו תמחק את השותף {affiliate.name} וכל הנתונים הקשורים אליו.
                              לא ניתן לבטל פעולה זו.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAffiliate(affiliate.affiliate_id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              מחק שותף
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין שותפים במערכת</h3>
              <p className="text-gray-600 mb-4">התחל על ידי יצירת השותף הראשון</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                הוסף שותף ראשון
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateManagementPage; 