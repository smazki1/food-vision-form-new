import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  Link,
  Gift,
  Save,
  RefreshCw,
  X
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { 
  useAffiliate, 
  useAffiliateClients, 
  useAffiliatePackages, 
  useAffiliateCommissions,
  useAffiliateDashboard,
  useUpdateAffiliate
} from '@/hooks/useAffiliate';
import type { Affiliate } from '@/types/affiliate';
import { toast } from 'sonner';
import { AffiliatePackageManagement } from './affiliate-details/AffiliatePackageManagement';

interface AffiliateDetailPanelProps {
  affiliateId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateDetailPanel: React.FC<AffiliateDetailPanelProps> = ({
  affiliateId,
  isOpen,
  onClose
}) => {
  const [notes, setNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  
  // Data hooks
  const { data: affiliate, isLoading: affiliateLoading } = useAffiliate(affiliateId || '');
  const { data: clients, isLoading: clientsLoading } = useAffiliateClients(affiliateId || '');
  const { data: packages, isLoading: packagesLoading } = useAffiliatePackages(affiliateId || '');
  const { data: commissions, isLoading: commissionsLoading } = useAffiliateCommissions(affiliateId || '');
  const { data: dashboardStats, isLoading: dashboardLoading } = useAffiliateDashboard(affiliateId || '');
  
  const updateAffiliateMutation = useUpdateAffiliate();

  // Initialize notes when affiliate data loads
  React.useEffect(() => {
    if (affiliate?.internal_notes) {
      setNotes(affiliate.internal_notes);
    }
  }, [affiliate]);

  const handleUpdateNotes = async () => {
    if (!affiliate) return;
    
    setIsUpdatingNotes(true);
    try {
      await updateAffiliateMutation.mutateAsync({
        affiliateId: affiliate.affiliate_id,
        updates: { internal_notes: notes }
      });
      toast.success('הערות עודכנו בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון הערות');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!affiliate) return;
    
    try {
      await updateAffiliateMutation.mutateAsync({
        affiliateId: affiliate.affiliate_id,
        updates: { status: newStatus }
      });
      toast.success('סטטוס עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון סטטוס');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">לא פעיל</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">מושעה</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getClientStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">לא פעיל</Badge>;
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">חדש</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (!isOpen || !affiliateId) return null;

  if (affiliateLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-0 rounded-none" dir="rtl">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">טוען פרטי שותף...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!affiliate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-0 rounded-none" dir="rtl">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">שותף לא נמצא</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 rounded-none overflow-y-auto" dir="rtl">
        {/* Header with close button */}
        <div className="sticky top-0 z-50 bg-white border-b p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">{affiliate.name}</DialogTitle>
                <p className="text-muted-foreground mt-1">{affiliate.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(affiliate.status)}
                  <Select value={affiliate.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="inactive">לא פעיל</SelectItem>
                      <SelectItem value="suspended">מושעה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">סקירה</TabsTrigger>
              <TabsTrigger value="clients">לקוחות</TabsTrigger>
              <TabsTrigger value="packages">חבילות</TabsTrigger>
              <TabsTrigger value="commissions">עמלות</TabsTrigger>
              <TabsTrigger value="notes">הערות</TabsTrigger>
              <TabsTrigger value="tools">כלים</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">סה"כ עמלות</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(affiliate.total_earnings || 0)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">סה"כ הפניות</p>
                        <p className="text-2xl font-bold">{affiliate.total_referrals || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">לקוחות פעילים</p>
                        <p className="text-2xl font-bold">
                          {dashboardStats?.active_clients || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">שיעור המרה</p>
                        <p className="text-2xl font-bold">0%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>פרטי חשבון</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>שם מלא</Label>
                      <Input value={affiliate.name} readOnly />
                    </div>
                    <div>
                      <Label>אימייל</Label>
                      <Input value={affiliate.email} readOnly />
                    </div>
                    <div>
                      <Label>טלפון</Label>
                      <Input value={affiliate.phone || ''} readOnly />
                    </div>
                    <div>
                      <Label>תאריך הצטרפות</Label>
                      <Input 
                        value={new Date(affiliate.created_at).toLocaleDateString('he-IL')} 
                        readOnly 
                      />
                    </div>
                  </div>

                  {/* User credentials */}
                  {affiliate.username && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">פרטי התחברות</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>שם משתמש</Label>
                          <Input value={affiliate.username} readOnly />
                        </div>
                        <div>
                          <Label>סיסמה</Label>
                          <Input value={affiliate.password || ''} type="password" readOnly />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commission rates */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">שיעורי עמלה</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>חבילת טעימה</Label>
                        <Input 
                          value={`${affiliate.commission_rate_tasting}%`} 
                          readOnly 
                        />
                      </div>
                      <div>
                        <Label>תפריט מלא</Label>
                        <Input 
                          value={`${affiliate.commission_rate_full_menu}%`} 
                          readOnly 
                        />
                      </div>
                      <div>
                        <Label>חבילה מתקדמת</Label>
                        <Input 
                          value={`${affiliate.commission_rate_deluxe}%`} 
                          readOnly 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>לקוחות שהופנו ({clients?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">טוען לקוחות...</p>
                    </div>
                  ) : clients && clients.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>שם לקוח</TableHead>
                          <TableHead>אימייל</TableHead>
                          <TableHead>סטטוס</TableHead>
                          <TableHead>תאריך הפניה</TableHead>
                          <TableHead>מקור הפניה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client, index) => (
                          <TableRow key={(client as any).client_id || index}>
                            <TableCell className="font-medium">
                              {(client as any).client?.restaurant_name || 
                               (client as any).client?.contact_name || 
                               'שם לא זמין'}
                            </TableCell>
                            <TableCell>
                              {(client as any).client?.email || 'אימייל לא זמין'}
                            </TableCell>
                            <TableCell>
                              {getClientStatusBadge(client.status || 'unknown')}
                            </TableCell>
                            <TableCell>
                              {(client as any).referred_at ? 
                                new Date((client as any).referred_at).toLocaleDateString('he-IL') : 
                                'לא זמין'
                              }
                            </TableCell>
                            <TableCell>{(client as any).referral_source || 'לא צוין'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">אין לקוחות רשומים</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packages Tab */}
            <TabsContent value="packages" className="space-y-4">
              <AffiliatePackageManagement 
                affiliateId={affiliate.affiliate_id} 
                affiliate={affiliate} 
              />
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>היסטוריית עמלות</CardTitle>
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">טוען עמלות...</p>
                    </div>
                  ) : commissions && commissions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>תאריך</TableHead>
                          <TableHead>סוג עסקה</TableHead>
                          <TableHead>סכום בסיס</TableHead>
                          <TableHead>שיעור עמלה</TableHead>
                          <TableHead>עמלה</TableHead>
                          <TableHead>סטטוס תשלום</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.commission_id}>
                            <TableCell>
                              {new Date(commission.created_at).toLocaleDateString('he-IL')}
                            </TableCell>
                            <TableCell>{commission.transaction_type}</TableCell>
                            <TableCell>{formatCurrency(commission.base_amount)}</TableCell>
                            <TableCell>{commission.commission_rate}%</TableCell>
                            <TableCell className="font-bold">
                              {formatCurrency(commission.commission_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                commission.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                commission.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {commission.payment_status === 'paid' ? 'שולם' :
                                 commission.payment_status === 'pending' ? 'ממתין' : 'לא שולם'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">אין עמלות רשומות</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>הערות אדמין</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes">הערות פנימיות על השותף</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="הערות פנימיות, תזכורות, מידע חשוב..."
                      rows={8}
                      className="mt-2"
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateNotes}
                    disabled={isUpdatingNotes}
                    className="w-full"
                  >
                    {isUpdatingNotes ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        שמור הערות
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      צ'אט פנימי
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      תכונה זו תתפתח בקרוב - צ'אט ישיר עם השותף
                    </p>
                    <Button variant="outline" disabled>
                      פתח צ'אט
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5" />
                      קישורי מעקב
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      קישורים מיוחדים לשותף למעקב אחר הפניות
                    </p>
                    <Button variant="outline" disabled>
                      צור קישור
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      קודי קופון
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      קופונים ייחודיים לשותף להפצה ללקוחות
                    </p>
                    <Button variant="outline" disabled>
                      צור קופון
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      דו"ח ביצועים
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      דו"ח מפורט על ביצועי השותף ועמלותיו
                    </p>
                    <Button variant="outline" disabled>
                      צור דו"ח
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 