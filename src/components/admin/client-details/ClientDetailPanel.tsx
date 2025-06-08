import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  Edit,
  Save,
  Phone,
  Mail,
  Building,
  Calendar,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

// Import the components we created
import { ClientSubmissionsSection } from './ClientSubmissionsSection';
import { ClientDesignSettings } from './ClientDesignSettings';
import { ClientPackageManagement } from './ClientPackageManagement';
import { ClientActivityNotes } from './ClientActivityNotes';
import { ClientPaymentStatus } from './ClientPaymentStatus';
import { ClientCostTracking } from './ClientCostTracking';

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
  const client = clients.find(c => c.client_id === clientId);
  
  // Use the client update hook
  const updateClientMutation = useClientUpdate();

  useEffect(() => {
    if (client) {
      setEditedClient(client);
    }
  }, [client]);

  const handleSave = async () => {
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
  };

  const handleCancel = () => {
    setEditedClient(client || {});
    setIsEditing(false);
  };

  // Function for always-editable fields (blur handler)
  const handleFieldBlur = async (fieldName: keyof Client, value: any) => {
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
  };

  const getStatusColor = (status: string) => {
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
  };

  if (isLoading) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="left" className="w-full sm:max-w-4xl overflow-y-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (error) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="left" className="w-full sm:max-w-4xl overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-red-600">שגיאה בטעינת נתונים</h3>
              <p className="text-gray-600 mt-2">{error.message}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!client) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="left" className="w-full sm:max-w-4xl overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600">לקוח לא נמצא</h3>
              <p className="text-gray-500 mt-2">לא נמצא לקוח עם המזהה המבוקש</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="border-b pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {client.restaurant_name?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div>
                <SheetTitle className="text-xl font-bold">
                  {client.restaurant_name || 'שם עסק לא זמין'}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(client.client_status)}>
                    {client.client_status || 'לא ידוע'}
                  </Badge>
                  {client.service_packages && (
                    <Badge variant="outline">
                      {client.service_packages.package_name}
                    </Badge>
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
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="costs" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">עלויות</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">עיצוב</span>
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
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Status Card */}
              <ClientPaymentStatus clientId={clientId} client={client} />

              {/* Activity and Notes Section - moved from activity tab */}
              <ClientActivityNotes clientId={clientId} />
            </TabsContent>

            <TabsContent value="packages">
              <ClientPackageManagement clientId={clientId} client={client} />
            </TabsContent>

            <TabsContent value="submissions">
              <ClientSubmissionsSection clientId={clientId} client={client} />
            </TabsContent>

            <TabsContent value="costs">
              <ClientCostTracking client={client} clientId={clientId} />
            </TabsContent>

            <TabsContent value="design">
              <ClientDesignSettings clientId={clientId} client={client} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ClientDetailPanel; 