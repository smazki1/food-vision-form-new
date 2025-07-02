import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, CheckCircle, XCircle, User, CreditCard, Package, Search, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePaymentApprovals, useApprovePayment, useRejectPayment, ICountPayment } from '@/hooks/usePaymentApprovals';
import { useAffiliates } from '@/hooks/useAffiliate';
import { Label } from '@/components/ui/label';

const PaymentApprovalsPage: React.FC = () => {
  const [selectedPayment, setSelectedPayment] = useState<ICountPayment | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch payments and affiliates using our custom hooks
  const { data: payments = [], isLoading: paymentsLoading, error } = usePaymentApprovals();
  const { data: affiliates = [] } = useAffiliates();
  
  // Mutations using our custom hooks
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();

  // Debug logging
  React.useEffect(() => {
    console.log('PaymentApprovalsPage - Loading:', paymentsLoading);
    console.log('PaymentApprovalsPage - Error:', error);
    console.log('PaymentApprovalsPage - Payments:', payments);
  }, [payments, paymentsLoading, error]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'duplicate': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPackageDetails = (packageType?: string) => {
    const packages = {
      tasting: { name: 'חבילת טעימות', price: 550, dishes: 12, images: 60 },
      full_menu: { name: 'תפריט מלא', price: 990, dishes: 30, images: 150 },
      deluxe: { name: 'חבילת דלוקס', price: 1690, dishes: 65, images: 325 }
    };
    return packageType ? packages[packageType as keyof typeof packages] : null;
  };

  const filteredPayments = useMemo(() => {
    if (!payments) return [];

    return payments.filter(payment => {
      const matchesSearch = searchTerm === '' || 
        payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_phone?.includes(searchTerm) ||
        payment.icount_doc_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const handleApprove = () => {
    if (!selectedPayment || !selectedAffiliate) return;
    
    approvePayment.mutate({
      paymentId: selectedPayment.payment_id,
      affiliateId: selectedAffiliate,
      adminNotes
    });
    
    // Reset form
    setSelectedPayment(null);
    setSelectedAffiliate('');
    setAdminNotes('');
  };

  const handleReject = () => {
    if (!selectedPayment) return;
    
    rejectPayment.mutate({
      paymentId: selectedPayment.payment_id,
      adminNotes: adminNotes || 'נדחה על ידי מנהל'
    });
    
    // Reset form
    setSelectedPayment(null);
    setAdminNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />ממתין</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />אושר</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />נדחה</Badge>;
      case 'duplicate':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300"><AlertCircle className="w-3 h-3 mr-1" />כפול</Badge>;
      default:
        return null;
    }
  };

  if (paymentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">טוען תשלומים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading payments:', error);
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>שגיאה בטעינת התשלומים</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">אישור תשלומים</h1>
        <p className="text-gray-600">
          ניהול ואישור תשלומי חבילות שהתקבלו דרך iCount
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            חיפוס וסינון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="חפש לפי אימייל, שם או טלפון..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="pending">ממתין לאישור</SelectItem>
                  <SelectItem value="approved">אושר</SelectItem>
                  <SelectItem value="rejected">נדחה</SelectItem>
                  <SelectItem value="duplicate">כפול</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין תשלומים התואמים לחיפוש</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment) => {
            const packageDetails = getPackageDetails(payment.detected_package_type);
            
            return (
              <Card key={payment.payment_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Payment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(payment.status)}
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(payment.payment_date), { addSuffix: true, locale: he })}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{payment.customer_email}</span>
                        </div>
                        {payment.customer_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{payment.customer_name}</span>
                          </div>
                        )}
                        {payment.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{payment.customer_phone}</span>
                          </div>
                        )}
                      </div>

                      {packageDetails && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">{packageDetails.name}</span>
                          </div>
                          <div className="text-sm text-blue-600">
                            {packageDetails.dishes} מנות • {packageDetails.images} תמונות • {packageDetails.price}₪
                          </div>
                        </div>
                      )}

                      {payment.admin_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{payment.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <div className="text-2xl font-bold text-green-600">
                        {payment.payment_amount.toLocaleString()}₪
                      </div>
                      
                      {payment.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setSelectedAffiliate('');
                                setAdminNotes('');
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              טפל בתשלום
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md" dir="rtl">
                            <DialogHeader>
                              <DialogTitle>אישור תשלום</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  בחר שותף לקישור
                                </label>
                                <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="בחר שותף..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {affiliates.map((affiliate) => (
                                      <SelectItem key={affiliate.affiliate_id} value={affiliate.affiliate_id}>
                                        {affiliate.name} ({affiliate.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  הערות מנהל (אופציונלי)
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="הערות נוספות..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button
                                  onClick={handleApprove}
                                  disabled={!selectedAffiliate || approvePayment.isPending}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {approvePayment.isPending ? 'מאשר...' : 'אשר ויצור חבילה'}
                                </Button>
                                <Button
                                  onClick={handleReject}
                                  disabled={rejectPayment.isPending}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  {rejectPayment.isPending ? 'דוחה...' : 'דחה תשלום'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentApprovalsPage; 