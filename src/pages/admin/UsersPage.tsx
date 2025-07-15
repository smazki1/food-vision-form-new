import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Check if admin client is available
const hasAdminAccess = () => {
  try {
    return import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY !== undefined;
  } catch {
    return false;
  }
};

// Lazy import supabaseAdmin only when needed and available
const getSupabaseAdmin = async () => {
  if (!hasAdminAccess()) {
    throw new Error('Admin access not available - missing service role key');
  }
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/supabaseAdmin');
    return supabaseAdmin;
  } catch (error) {
    console.warn('Failed to load supabaseAdmin:', error);
    throw error;
  }
};
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  UserCheck,
  UserX,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  role?: 'admin' | 'editor' | 'customer';
  client_id?: string;
  restaurant_name?: string;
  contact_name?: string;
  phone?: string;
  client_status?: string;
  remaining_servings?: number;
}

interface CreateCustomerForm {
  email: string;
  password: string;
  restaurant_name: string;
  contact_name: string;
  phone: string;
  package_id?: string;
}

const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCustomerForm>({
    email: '',
    password: '',
    restaurant_name: '',
    contact_name: '',
    phone: '',
    package_id: ''
  });

  const queryClient = useQueryClient();

  // Fetch all users with their roles and client information
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Check if admin access is available
      if (!hasAdminAccess()) {
        console.warn('Admin access not available - showing limited user data');
        // Return limited data based on what we can access
        return [];
      }

      try {
        // Get all auth users using admin client
        const supabaseAdmin = await getSupabaseAdmin();
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
          throw authError;
        }

        // Get user roles from user_roles table (use any type to bypass TypeScript issues)
        const { data: roleData, error: roleError } = await (supabase as any)
          .from('user_roles')
          .select('user_id, role');

        if (roleError) {
          console.error('Error fetching user roles:', roleError);
          // Don't throw error for user_roles - it might not exist or be accessible
          console.warn('User roles table not accessible, continuing without roles');
        }

        // Get client information for customer users
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            client_id,
            user_auth_id,
            restaurant_name,
            contact_name,
            phone,
            client_status,
            remaining_servings
          `);

        if (clientError) {
          console.error('Error fetching client data:', clientError);
          throw clientError;
        }

        // Combine all data
        const usersWithData: User[] = authUsers.map(authUser => {
          const userRole = roleData?.find((r: any) => r.user_id === authUser.id);
          const clientInfo = clientData?.find(c => c.user_auth_id === authUser.id);
          
          return {
            id: authUser.id,
            email: authUser.email || '',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            email_confirmed_at: authUser.email_confirmed_at,
            role: userRole?.role || (clientInfo ? 'customer' : 'customer'),
            client_id: clientInfo?.client_id,
            restaurant_name: clientInfo?.restaurant_name,
            contact_name: clientInfo?.contact_name,
            phone: clientInfo?.phone,
            client_status: clientInfo?.client_status,
            remaining_servings: clientInfo?.remaining_servings
          };
        });

        return usersWithData;
      } catch (error) {
        console.error('Error in admin users query:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false
  });

  // Get available packages for new customers
  const { data: packages = [] } = useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('package_id, package_name, price, total_servings')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (formData: CreateCustomerForm) => {
      // Check if admin access is available
      if (!hasAdminAccess()) {
        throw new Error('Admin access not available - cannot create users');
      }

      // Create auth user using admin client
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create client record
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_auth_id: authData.user.id,
          restaurant_name: formData.restaurant_name,
          contact_name: formData.contact_name,
          phone: formData.phone,
          email: formData.email,
          client_status: 'active',
          remaining_servings: 0,
          current_package_id: formData.package_id || null
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Try to add customer role (use any type to bypass TypeScript issues)
      try {
        await (supabase as any)
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'customer'
          });
      } catch (roleError) {
        console.warn('Could not add user role:', roleError);
        // Continue without role - this is not critical
      }

      return { user: authData.user, client: clientData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('חשבון לקוח חדש נוצר בהצלחה');
      setIsCreateDialogOpen(false);
      setCreateForm({
        email: '',
        password: '',
        restaurant_name: '',
        contact_name: '',
        phone: '',
        package_id: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating customer:', error);
      toast.error(`שגיאה ביצירת חשבון לקוח: ${error.message}`);
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First delete from clients if exists
      await supabase
        .from('clients')
        .delete()
        .eq('user_auth_id', userId);

      // Try to delete from user_roles (use any type to bypass TypeScript issues)
      try {
        await (supabase as any)
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
      } catch (roleError) {
        console.warn('Could not delete user role:', roleError);
        // Continue without role deletion - this is not critical
      }

      // Delete auth user using admin client
      if (hasAdminAccess()) {
        const supabaseAdmin = await getSupabaseAdmin();
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
      } else {
        throw new Error('Admin access not available - cannot delete users');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('המשתמש נמחק בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast.error(`שגיאה במחיקת משתמש: ${error.message}`);
    }
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.client_status === 'active') ||
        (statusFilter === 'inactive' && user.client_status !== 'active') ||
        (statusFilter === 'confirmed' && user.email_confirmed_at) ||
        (statusFilter === 'unconfirmed' && !user.email_confirmed_at);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Handle form submission
  const handleCreateCustomer = () => {
    if (!createForm.email || !createForm.password || !createForm.restaurant_name || !createForm.contact_name) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }

    createCustomerMutation.mutate(createForm);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">מנהל</Badge>;
      case 'editor':
        return <Badge variant="secondary">עורך</Badge>;
      case 'customer':
        return <Badge variant="outline">לקוח</Badge>;
      default:
        return <Badge variant="outline">לא מוגדר</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.role === 'customer') {
      switch (user.client_status) {
        case 'active':
          return <Badge variant="default" className="bg-green-100 text-green-800">פעיל</Badge>;
        case 'inactive':
          return <Badge variant="secondary">לא פעיל</Badge>;
        default:
          return <Badge variant="outline">לא מוגדר</Badge>;
      }
    }
    return user.email_confirmed_at ? 
      <Badge variant="default" className="bg-green-100 text-green-800">מאושר</Badge> : 
      <Badge variant="secondary">לא מאושר</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">טוען משתמשים...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">שגיאה בטעינת המשתמשים</h2>
          <p className="text-gray-600">אנא נסה לרענן את הדף</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Admin Access Warning */}
        {!hasAdminAccess() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600">⚠️</div>
              <div className="text-yellow-800">
                <strong>מצב מוגבל:</strong> חסר מפתח שירות מנהל (VITE_SUPABASE_SERVICE_ROLE_KEY). 
                חלק מהתכונות לא יהיו זמינות.
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ניהול משתמשים</h1>
            <p className="text-muted-foreground">
              ניהול חשבונות משתמשים, יצירת לקוחות חדשים ועריכת פרטים
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2" 
                disabled={!hasAdminAccess()}
                title={!hasAdminAccess() ? 'דרוש מפתח שירות מנהל ליצירת משתמשים' : ''}
              >
                <Plus className="h-4 w-4" />
                לקוח חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>יצירת לקוח חדש</DialogTitle>
                <DialogDescription>
                  צור חשבון חדש ללקוח במערכת
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="דוא״ל הלקוח"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">סיסמה *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="סיסמה ראשונית"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">שם מסעדה *</Label>
                  <Input
                    id="restaurant_name"
                    placeholder="שם המסעדה"
                    value={createForm.restaurant_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">איש קשר *</Label>
                  <Input
                    id="contact_name"
                    placeholder="שם איש הקשר"
                    value={createForm.contact_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, contact_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    placeholder="מספר טלפון"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package_id">חבילה</Label>
                  <Select 
                    value={createForm.package_id} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, package_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר חבילה (אופציונלי)" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map(pkg => (
                        <SelectItem key={pkg.package_id} value={pkg.package_id}>
                          {pkg.package_name} - ₪{pkg.price} ({pkg.total_servings} מנות)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateCustomer}
                    disabled={createCustomerMutation.isPending}
                    className="flex-1"
                  >
                    {createCustomerMutation.isPending ? 'יוצר...' : 'צור לקוח'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              סינון וחיפוש
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש לפי אימייל, שם מסעדה או איש קשר..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל התפקידים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל התפקידים</SelectItem>
                  <SelectItem value="admin">מנהל</SelectItem>
                  <SelectItem value="editor">עורך</SelectItem>
                  <SelectItem value="customer">לקוח</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הסטטוסים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                  <SelectItem value="confirmed">מאושר</SelectItem>
                  <SelectItem value="unconfirmed">לא מאושר</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                {filteredUsers.length} משתמשים
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>רשימת משתמשים</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פרטי משתמש</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פרטי לקוח</TableHead>
                  <TableHead>תאריך הצטרפות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.email}</div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role || 'customer')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell>
                      {user.role === 'customer' ? (
                        <div className="space-y-1">
                          <div className="font-medium">{user.restaurant_name}</div>
                          <div className="text-sm text-gray-500">{user.contact_name}</div>
                          {user.remaining_servings !== undefined && (
                            <div className="text-sm text-blue-600">
                              {user.remaining_servings} מנות נותרו
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.created_at).toLocaleDateString('he-IL')}
                      </div>
                      {user.last_sign_in_at && (
                        <div className="text-xs text-gray-500">
                          כניסה אחרונה: {new Date(user.last_sign_in_at).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            עריכה
                          </DropdownMenuItem>
                          {user.role === 'customer' && user.client_id && (
                            <DropdownMenuItem onClick={() => {
                              window.open(`/admin/clients/${user.client_id}`, '_blank');
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              צפייה בלקוח
                            </DropdownMenuItem>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                מחיקה
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  פעולה זו תמחק את המשתמש {user.email} לצמיתות. 
                                  לא ניתן לבטל פעולה זו.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">לא נמצאו משתמשים</h3>
                <p className="text-gray-500">נסה לשנות את פרמטרי החיפוש</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersPage; 