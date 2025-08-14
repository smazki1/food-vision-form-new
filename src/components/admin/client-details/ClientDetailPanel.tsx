import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Package, 
  FileText, 
  CreditCard, 
  Palette,
  X,
  ArrowLeft,
  Edit,
  Save,
  Phone,
  Mail,
  Building,
  Calendar,
  AlertTriangle,
  DollarSign,
  Eye
} from 'lucide-react';

// Import the components we created
import { ClientSubmissionsSection } from './ClientSubmissionsSection';
import { ClientSubmissions2 } from './ClientSubmissions2';
import { ClientDesignSettings } from './ClientDesignSettings';
import { ClientPackageManagement } from './ClientPackageManagement';
import { ClientActivityNotes } from './ClientActivityNotes';
import { ClientPaymentStatus } from './ClientPaymentStatus';
import { ClientCostTracking } from './ClientCostTracking';
import CustomerReviewPageTab from './CustomerReviewPageTab';
import { supabase } from '@/integrations/supabase/client';

// Import existing hooks
import { useClients } from '@/hooks/useClients';
import { useClientUpdate } from '@/hooks/useClientUpdate';
import { Client } from '@/types/client';

interface ClientDetailPanelProps {
  clientId: string;
  onClose: () => void;
}

export const ClientDetailPanel: React.FC<ClientDetailPanelProps> = ({
  clientId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});
  
  const queryClient = useQueryClient();
  
  // Use the existing clients hook and find our specific client
  const { clients, isLoading, error } = useClients();
  
  // CRITICAL FIX: Use useMemo to prevent unnecessary re-renders and maintain stable client reference
  const client = useMemo(() => {
    return clients.find(c => c.client_id === clientId);
  }, [clients, clientId]);
  
  // Use the client update hook
  const updateClientMutation = useClientUpdate();

  // CRITICAL FIX: Use useCallback for stable function references to prevent child re-renders
  const handleFieldBlur = useCallback(async (fieldName: keyof Client, value: any) => {
    if (!client) return;
    
    // Skip if value hasn't changed
    if (client[fieldName] === value) return;
    
    try {
      await updateClientMutation.mutateAsync({
        clientId: client.client_id,
        updates: { [fieldName]: value }
      });
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      // Error handling is done in the hook
    }
  }, [client, updateClientMutation]);

  const handleSave = useCallback(async () => {
    if (!client || !editedClient) return;
    
    try {
      // Calculate what actually changed
      const changes: Partial<Client> = {};
      Object.keys(editedClient).forEach(key => {
        const typedKey = key as keyof Client;
        if (editedClient[typedKey] !== client[typedKey]) {
          (changes as any)[typedKey] = editedClient[typedKey];
        }
      });

      if (Object.keys(changes).length === 0) {
        toast.info('לא נמצאו שינויים לשמירה');
        setIsEditing(false);
        return;
      }

      await updateClientMutation.mutateAsync({
        clientId: client.client_id,
        updates: changes
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
      // Error handling is done in the hook
    }
  }, [client, editedClient, updateClientMutation]);

  const handleCancel = useCallback(() => {
    setEditedClient(client || {});
    setIsEditing(false);
  }, [client]);

  // CRITICAL FIX: Only update editedClient when client actually changes, not on every render
  useEffect(() => {
    if (client && (!editedClient.client_id || editedClient.client_id !== client.client_id)) {
      setEditedClient(client);
    }
  }, [client?.client_id, client?.updated_at]); // Only depend on ID and update timestamp

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'פעיל':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'לא פעיל':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'בהמתנה':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // CRITICAL FIX: Memoize loading/error/not found states to prevent unnecessary re-renders
  const loadingContent = useMemo(() => (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full w-full overflow-y-auto">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>
  ), [onClose]);

  const errorContent = useMemo(() => (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full w-full overflow-y-auto">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-red-600">שגיאה בטעינת נתונים</h3>
              <p className="text-gray-600 mt-2">{error?.message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [onClose, error]);

  const notFoundContent = useMemo(() => (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full w-full overflow-y-auto">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600">לקוח לא נמצא</h3>
              <p className="text-gray-500 mt-2">לא נמצא לקוח עם המזהה המבוקש</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [onClose]);

  if (isLoading) {
    return loadingContent;
  }

  if (error) {
    return errorContent;
  }

  if (!client) {
    return notFoundContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full w-full overflow-y-auto">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {client.restaurant_name?.charAt(0).toUpperCase() || 'L'}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {client.restaurant_name || 'לקוח ללא שם'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(client.client_status || 'לא פעיל')}>
                      {client.client_status || 'לא פעיל'}
                    </Badge>
                    {client.contact_name && (
                      <span className="text-sm text-muted-foreground">
                        {client.contact_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    עריכה
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      ביטול
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      שמירה
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">פרטים</span>
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">חבילות</span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">הגשות</span>
            </TabsTrigger>
            <TabsTrigger value="submissions2" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">הגשות 2</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">עלויות</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">עיצוב</span>
            </TabsTrigger>
            <TabsTrigger value="customer-review" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">עמוד לקוח</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      פרטי הלקוח
                    </CardTitle>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={handleCancel}>
                            ביטול
                          </Button>
                          <Button size="sm" onClick={handleSave}>
                            שמור
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          עריכה
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>שם המסעדה/עסק</Label>
                          <Input
                            value={editedClient.restaurant_name || ''}
                            onChange={(e) => setEditedClient(prev => ({ ...prev, restaurant_name: e.target.value }))}
                            onBlur={(e) => handleFieldBlur('restaurant_name', e.target.value)}
                            className="font-medium"
                            placeholder="שם המסעדה"
                          />
                        </div>
                        <div>
                          <Label>איש קשר</Label>
                          <Input
                            value={editedClient.contact_name || ''}
                            onChange={(e) => setEditedClient(prev => ({ ...prev, contact_name: e.target.value }))}
                            onBlur={(e) => handleFieldBlur('contact_name', e.target.value)}
                            placeholder="שם איש הקשר"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">טלפון</Label>
                          <Input
                            value={editedClient.phone || ''}
                            onChange={(e) => setEditedClient(prev => ({ ...prev, phone: e.target.value }))}
                            onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                            placeholder="מספר טלפון"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">אימייל</Label>
                          <Input
                            type="email"
                            value={editedClient.email || ''}
                            onChange={(e) => setEditedClient(prev => ({ ...prev, email: e.target.value }))}
                            onBlur={(e) => handleFieldBlur('email', e.target.value)}
                            placeholder="כתובת אימייל"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">סוג עסק</Label>
                          <Input
                            value={editedClient.business_type || ''}
                            onChange={(e) => setEditedClient(prev => ({ ...prev, business_type: e.target.value }))}
                            onBlur={(e) => handleFieldBlur('business_type', e.target.value)}
                            placeholder="סוג העסק"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">סטטוס לקוח</Label>
                          <Select
                            value={editedClient.client_status || 'פוטנציאלי'}
                            onValueChange={(value) => {
                              setEditedClient(prev => ({ ...prev, client_status: value }));
                              handleFieldBlur('client_status', value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סטטוס" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="פוטנציאלי">פוטנציאלי</SelectItem>
                              <SelectItem value="פעיל">פעיל</SelectItem>
                              <SelectItem value="לא פעיל">לא פעיל</SelectItem>
                              <SelectItem value="הושעה">הושעה</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">כתובת</Label>
                        <Input
                          value={editedClient.address || ''}
                          onChange={(e) => setEditedClient(prev => ({ ...prev, address: e.target.value }))}
                          onBlur={(e) => handleFieldBlur('address', e.target.value)}
                          placeholder="כתובת העסק"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">אתר אינטרנט</Label>
                        <Input
                          type="url"
                          value={editedClient.website_url || ''}
                          onChange={(e) => setEditedClient(prev => ({ ...prev, website_url: e.target.value }))}
                          onBlur={(e) => handleFieldBlur('website_url', e.target.value)}
                          placeholder="https://example.com"
                          dir="ltr"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">שם העסק:</span>
                            <span>{client.restaurant_name || 'לא זמין'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">איש קשר:</span>
                            <span>{client.contact_name || 'לא זמין'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">טלפון:</span>
                            <span>{client.phone || 'לא זמין'}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">אימייל:</span>
                            <span>{client.email || 'לא זמין'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">תאריך הצטרפות:</span>
                            <span>{new Date(client.created_at).toLocaleDateString('he-IL')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">מנות שנותרו:</span>
                            <span className={client.remaining_servings > 0 ? 'text-green-600' : 'text-red-600'}>
                              {client.remaining_servings}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {client.business_type && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <span className="font-medium">סוג עסק: </span>
                          <span>{client.business_type}</span>
                        </div>
                      )}
                      
                      {client.address && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <span className="font-medium">כתובת: </span>
                          <span>{client.address}</span>
                        </div>
                      )}
                      
                      {client.website_url && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <span className="font-medium">אתר אינטרנט: </span>
                          <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {client.website_url}
                          </a>
                        </div>
                      )}

                      {/* Admin account manager */}
                      <div className="mt-6 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">חשבון משתמש ללקוח</span>
                        </div>
                        <AdminClientAccountManager client={client} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Status Card */}
              <ClientPaymentStatus clientId={client.client_id} client={client} />

              {/* Activity and Notes Section - moved from activity tab */}
              <ClientActivityNotes key={client.client_id} clientId={client.client_id} />
            </TabsContent>

            <TabsContent value="packages">
              <ClientPackageManagement key={client.client_id} clientId={client.client_id} client={client} />
            </TabsContent>

            <TabsContent value="submissions">
              <ClientSubmissionsSection key={client.client_id} clientId={client.client_id} client={client} />
            </TabsContent>

            <TabsContent value="submissions2">
              <ClientSubmissions2 key={client.client_id} clientId={client.client_id} client={client} />
            </TabsContent>

            <TabsContent value="costs">
              <ClientCostTracking key={client.client_id} client={client} clientId={client.client_id} />
            </TabsContent>

            <TabsContent value="design">
              <ClientDesignSettings key={client.client_id} clientId={client.client_id} client={client} />
            </TabsContent>

            <TabsContent value="customer-review">
              <CustomerReviewPageTab key={client.client_id} clientId={client.client_id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPanel; 

// Admin-only account manager component
const AdminClientAccountManager: React.FC<{ client: Client }> = ({ client }) => {
  const [email, setEmail] = useState(client.email || '');
  const [role, setRole] = useState<'admin' | 'editor' | 'customer' | 'affiliate'>('customer');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedUserId, setLinkedUserId] = useState<string | null>(client.user_auth_id || null);

  useEffect(() => {
    setEmail(client.email || '');
    setLinkedUserId(client.user_auth_id || null);
  }, [client.email, client.user_auth_id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
      if (!supabaseUrl) throw new Error('Missing SUPABASE URL');

      // Treat zero-UUID as invalid and create a new auth user when needed
      const INVALID_ID = '00000000-0000-0000-0000-000000000000';
      let userId = linkedUserId && linkedUserId !== INVALID_ID ? linkedUserId : null;
      if (!userId) {
        const passwordToUse = newPassword && newPassword.length >= 8 ? newPassword : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        const res = await fetch(`${supabaseUrl}/functions/v1/admin-user-management?action=create-user`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: passwordToUse, userData: { role: 'customer' } })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to create user');
        userId = json?.user?.id;
        if (!userId) throw new Error('Missing created user id');

        // Link to client
        await (supabase as any)
          .from('clients')
          .update({ user_auth_id: userId })
          .eq('client_id', client.client_id);

        setLinkedUserId(userId);
      }

      // Update auth user if email/password changed
      const updates: Record<string, any> = {};
      if (email && email !== client.email) updates.email = email;
      if (newPassword && newPassword.length >= 8) updates.password = newPassword;
      if (Object.keys(updates).length > 0) {
        const res2 = await fetch(`${supabaseUrl}/functions/v1/admin-user-management?action=update-user`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userData: updates })
        });
        const json2 = await res2.json().catch(() => ({}));
        if (res2.status === 404 && (json2?.error || '').toLowerCase().includes('user not found')) {
          // Recreate and relink, then retry once
          const pwd = updates.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
          const resCreate = await fetch(`${supabaseUrl}/functions/v1/admin-user-management?action=create-user`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pwd, userData: { role: 'customer' } })
          });
          const jsonCreate = await resCreate.json().catch(() => ({}));
          if (!resCreate.ok) throw new Error(jsonCreate?.error || 'Failed to recreate user');
          userId = jsonCreate?.user?.id;
          await (supabase as any).from('clients').update({ user_auth_id: userId }).eq('client_id', client.client_id);
          const resRetry = await fetch(`${supabaseUrl}/functions/v1/admin-user-management?action=update-user`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userData: updates })
          });
          const jsonRetry = await resRetry.json().catch(() => ({}));
          if (!resRetry.ok) throw new Error(jsonRetry?.error || 'Failed to update user');
        } else if (!res2.ok) {
          throw new Error(json2?.error || 'Failed to update user');
        }
      }

      // Upsert role
      await (supabase as any)
        .from('user_roles')
        .upsert({ user_id: userId, role })
        .select()
        .maybeSingle();

      // Store password reference if changed
      if (newPassword && newPassword.length >= 8) {
        await (supabase as any)
          .from('user_password_references')
          .upsert({
            user_id: userId,
            password_reference: newPassword,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString()
          });
      }

      toast.success('פרטי החשבון עודכנו בהצלחה');
    } catch (e: any) {
      toast.error(e?.message || 'שגיאה בעדכון חשבון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>אימייל</Label>
          <Input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
        </div>
        <div>
          <Label>תפקיד</Label>
          <Select value={role} onValueChange={(v: any) => setRole(v)}>
            <SelectTrigger>
              <SelectValue placeholder="בחר תפקיד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">לקוח</SelectItem>
              <SelectItem value="editor">עורך</SelectItem>
              <SelectItem value="admin">מנהל</SelectItem>
              <SelectItem value="affiliate">שותף</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>סיסמה חדשה (אופציונלי)</Label>
          <Input dir="ltr" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="לפחות 8 תווים" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? 'שומר...' : 'שמור חשבון'}
        </Button>
        {linkedUserId && (
          <Button size="sm" variant="outline" onClick={async () => {
            await navigator.clipboard.writeText(`Email: ${email}`);
            toast.success('אימייל הועתק');
          }}>העתק אימייל</Button>
        )}
      </div>
      {!linkedUserId && (
        <div className="text-xs text-gray-500">אין משתמש מקושר. שמור כדי ליצור חשבון חדש ולקשר אותו ללקוח.</div>
      )}
    </div>
  );
};