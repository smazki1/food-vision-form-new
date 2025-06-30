import { supabase } from '@/integrations/supabase/client';
import type {
  Affiliate,
  AffiliateClient,
  AffiliatePackage,
  AffiliatePackageAllocation,
  AffiliateCommission,
  AffiliateDashboardStats,
  ClientWithAffiliate,
  CreateAffiliateForm,
  LinkClientToAffiliateForm,
  PurchasePackageForm,
  AllocatePackageForm
} from '@/types/affiliate';

// Lazy import for admin functions
const getSupabaseAdmin = async () => {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/supabaseAdmin');
    return supabaseAdmin;
  } catch (error) {
    console.warn('Supabase admin client not available:', error);
    return null;
  }
};

// Helper function to generate secure password
const generateSecurePassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

// Helper function to generate username from email
const generateUsername = (email: string): string => {
  return email; // Use email as username directly
};

// Package pricing constants
export const PACKAGE_PRICING = {
  tasting: { dishes: 12, images: 60, price: 550, commission_rate: 30 },
  full_menu: { dishes: 30, images: 150, price: 990, commission_rate: 25 },
  deluxe: { dishes: 65, images: 325, price: 1690, commission_rate: 20 }
} as const;

// Affiliate CRUD operations
export const affiliateApi = {
  // Get all affiliates (admin only)
  async getAllAffiliates(): Promise<Affiliate[]> {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Add default values for new fields if they don't exist
    return (data || []).map(affiliate => ({
      ...affiliate,
      username: (affiliate as any).username || null,
      password: (affiliate as any).password || null
    } as Affiliate));
  },

  // Get affiliate by ID
  async getAffiliateById(affiliateId: string): Promise<Affiliate | null> {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      username: (data as any).username || null,
      password: (data as any).password || null
    } as Affiliate;
  },

  // Get current user's affiliate profile
  async getCurrentAffiliate(): Promise<Affiliate | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_auth_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      username: (data as any).username || null,
      password: (data as any).password || null
    } as Affiliate;
  },

  // Create new affiliate
  async createAffiliate(formData: CreateAffiliateForm): Promise<Affiliate> {
    try {
      // Generate credentials
      const username = generateUsername(formData.email);
      const password = generateSecurePassword();

      // Try to create Supabase auth user (fallback if admin client not available)
      let userAuthId = null;
      const adminClient = await getSupabaseAdmin();
      if (adminClient) {
        try {
          const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email: formData.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              role: 'affiliate',
              name: formData.name,
              username: username
            }
          });

          if (!authError && authUser?.user) {
            userAuthId = authUser.user.id;
          }
        } catch (authCreateError) {
          console.warn('Could not create auth user:', authCreateError);
          // Continue without auth user - credentials will still be stored for manual setup
        }
      } else {
        console.warn('Admin client not available - continuing without auth user creation');
      }

      // Create affiliate record with auth user ID and credentials
      const insertData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        commission_rate_tasting: formData.commission_rate_tasting || 30,
        commission_rate_full_menu: formData.commission_rate_full_menu || 25,
        commission_rate_deluxe: formData.commission_rate_deluxe || 20,
        user_auth_id: userAuthId,
        username: username,
        password: password,
      };

      const { data, error } = await supabase
        .from('affiliates')
        .insert(insertData)
        .select()
        .single();

      // If columns don't exist, retry without username/password
      if (error && error.message?.includes("password") && error.message?.includes("schema cache")) {
        console.warn('Username/password columns not available, creating affiliate without credentials');
        const { username: _, password: __, ...dataWithoutCredentials } = insertData;
        
        const { data: retryData, error: retryError } = await supabase
          .from('affiliates')
          .insert(dataWithoutCredentials)
          .select()
          .single();
          
        if (retryError) throw retryError;
        
        return {
          ...retryData,
          username: username, // Return generated credentials even if not stored
          password: password
        } as Affiliate;
      }

      if (error) throw error;
      
      return {
        ...data,
        username: (data as any).username || username,
        password: (data as any).password || password
      } as Affiliate;
    } catch (error) {
      console.error('Failed to create affiliate:', error);
      throw error;
    }
  },

  // Update affiliate
  async updateAffiliate(affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    const { data, error } = await supabase
      .from('affiliates')
      .update(updates)
      .eq('affiliate_id', affiliateId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      username: (data as any).username || null,
      password: (data as any).password || null
    } as Affiliate;
  },

  // Delete affiliate
  async deleteAffiliate(affiliateId: string): Promise<void> {
    const { error } = await supabase
      .from('affiliates')
      .delete()
      .eq('affiliate_id', affiliateId);

    if (error) throw error;
  }
};

// Affiliate clients operations
export const affiliateClientApi = {
  // Get affiliate's clients
  async getAffiliateClients(affiliateId: string): Promise<ClientWithAffiliate[]> {
    const { data, error } = await supabase
      .from('affiliate_clients')
      .select(`
        *,
        clients:client_id (
          client_id,
          restaurant_name,
          contact_name,
          email,
          phone,
          current_package_id,
          remaining_servings,
          payment_status,
          payment_amount_ils,
          created_at
        )
      `)
      .eq('affiliate_id', affiliateId)
      .eq('status', 'active')
      .order('referred_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match ClientWithAffiliate interface
    return (data || []).map(item => ({
      client_id: item.clients.client_id,
      name: item.clients.restaurant_name || item.clients.contact_name || 'Unknown',
      email: item.clients.email,
      phone: item.clients.phone,
      status: 'active', // Since we're filtering by active status
      restaurant_name: item.clients.restaurant_name,
      contact_name: item.clients.contact_name
    }));
  },

  // Link client to affiliate
  async linkClientToAffiliate(formData: LinkClientToAffiliateForm): Promise<AffiliateClient> {
    const { data, error } = await supabase
      .from('affiliate_clients')
      .insert({
        affiliate_id: formData.affiliate_id,
        client_id: formData.client_id,
        referral_source: formData.referral_source,
        referral_method: 'name_reference'
      })
      .select()
      .single();

    if (error) throw error;

    // Note: Client table doesn't have affiliate reference fields
    // Affiliate relationship is tracked in affiliate_clients table only

    return data;
  },

  // Unlink client from affiliate
  async unlinkClientFromAffiliate(clientId: string): Promise<void> {
    await supabase
      .from('affiliate_clients')
      .update({ status: 'inactive' })
      .eq('client_id', clientId);

    // Note: Client table doesn't have affiliate reference fields
    // Affiliate relationship is tracked in affiliate_clients table only
  }
};

// Affiliate packages operations
export const affiliatePackageApi = {
  // Get affiliate's packages
  async getAffiliatePackages(affiliateId: string): Promise<AffiliatePackage[]> {
    const { data, error } = await supabase
      .from('affiliate_packages')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    
    // Add calculated properties
    const packagesWithCalculated = (data || []).map(pkg => ({
      ...pkg,
      used_dishes: pkg.dishes_used,
      used_images: pkg.images_used,
      remaining_dishes: pkg.total_dishes - pkg.dishes_used,
      remaining_images: pkg.total_images - pkg.images_used
    }));
    
    return packagesWithCalculated;
  },

  // Purchase package
  async purchasePackage(affiliateId: string, formData: PurchasePackageForm): Promise<AffiliatePackage> {
    const packageConfig = PACKAGE_PRICING[formData.package_type];
    
    const { data, error } = await supabase
      .from('affiliate_packages')
      .insert({
        affiliate_id: affiliateId,
        package_type: formData.package_type,
        total_dishes: packageConfig.dishes,
        total_images: packageConfig.images,
        dishes_used: 0,
        images_used: 0,
        purchase_price: packageConfig.price
      })
      .select()
      .single();

    if (error) throw error;
    
    // Add calculated properties
    const packageWithCalculated = {
      ...data,
      used_dishes: data.dishes_used,
      used_images: data.images_used,
      remaining_dishes: data.total_dishes - data.dishes_used,
      remaining_images: data.total_images - data.images_used
    };
    
    return packageWithCalculated;
  },

  // Get package allocations
  async getPackageAllocations(packageId: string): Promise<AffiliatePackageAllocation[]> {
    const { data, error } = await supabase
      .from('affiliate_package_allocations')
      .select(`
        *,
        clients:client_id (
          restaurant_name,
          contact_name,
          email
        )
      `)
      .eq('affiliate_package_id', packageId)
      .order('allocated_at', { ascending: false });

    if (error) throw error;
    
    // Add alias properties for compatibility
    const allocationsWithAliases = (data || []).map(allocation => ({
      ...allocation,
      dishes_allocated: allocation.allocated_dishes,
      images_allocated: allocation.allocated_images
    }));
    
    return allocationsWithAliases;
  },

  // Allocate package to client
  async allocatePackage(formData: AllocatePackageForm): Promise<AffiliatePackageAllocation> {
    // Check if enough resources available - use calculated values
    const { data: packageData, error: packageError } = await supabase
      .from('affiliate_packages')
      .select('total_dishes, total_images, dishes_used, images_used')
      .eq('package_id', formData.affiliate_package_id)
      .single();

    if (packageError) throw packageError;

    const remaining_dishes = packageData.total_dishes - packageData.dishes_used;
    const remaining_images = packageData.total_images - packageData.images_used;

    if (remaining_dishes < formData.dishes_allocated || 
        remaining_images < formData.images_allocated) {
      throw new Error('Not enough resources available in package');
    }

    // Create allocation using database column names
    const { data, error } = await supabase
      .from('affiliate_package_allocations')
      .insert({
        affiliate_package_id: formData.affiliate_package_id,
        client_id: formData.client_id,
        allocated_dishes: formData.dishes_allocated,
        allocated_images: formData.images_allocated,
        dishes_used: 0,
        images_used: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Update package used resources
    await supabase
      .from('affiliate_packages')
      .update({
        dishes_used: packageData.dishes_used + formData.dishes_allocated,
        images_used: packageData.images_used + formData.images_allocated
      })
      .eq('package_id', formData.affiliate_package_id);

    // Add alias properties
    const allocationWithAliases = {
      ...data,
      dishes_allocated: data.allocated_dishes,
      images_allocated: data.allocated_images
    };

    return allocationWithAliases;
  }
};

// Commission operations
export const affiliateCommissionApi = {
  // Get affiliate commissions
  async getAffiliateCommissions(affiliateId: string): Promise<AffiliateCommission[]> {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select(`
        *,
        clients:client_id (
          restaurant_name,
          contact_name
        )
      `)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Add alias properties for compatibility
    const commissionsWithAliases = (data || []).map(commission => ({
      ...commission,
      amount: commission.base_amount,
      transaction_date: commission.created_at,
      notes: commission.payment_notes
    }));
    
    return commissionsWithAliases;
  },

  // Create commission
  async createCommission(commission: Omit<AffiliateCommission, 'commission_id' | 'created_at'>): Promise<AffiliateCommission> {
    // Map the input to database field names
    const dbCommission = {
      affiliate_id: commission.affiliate_id,
      client_id: commission.client_id,
      transaction_type: commission.transaction_type,
      package_type: commission.package_type,
      base_amount: commission.amount || commission.base_amount,
      commission_rate: commission.commission_rate,
      commission_amount: commission.commission_amount,
      payment_status: commission.payment_status,
      payment_date: commission.payment_date,
      payment_notes: commission.notes || commission.payment_notes
    };

    const { data, error } = await supabase
      .from('affiliate_commissions')
      .insert(dbCommission)
      .select()
      .single();

    if (error) throw error;
    
    // Add alias properties
    const commissionWithAliases = {
      ...data,
      amount: data.base_amount,
      transaction_date: data.created_at,
      notes: data.payment_notes
    };
    
    return commissionWithAliases;
  },

  // Update commission payment status
  async updateCommissionPaymentStatus(
    commissionId: string, 
    status: 'pending' | 'paid' | 'cancelled',
    notes?: string
  ): Promise<void> {
    const updateData: any = { 
      payment_status: status,
      payment_notes: notes
    };

    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('affiliate_commissions')
      .update(updateData)
      .eq('commission_id', commissionId);

    if (error) throw error;
  }
};

// Dashboard statistics
export const affiliateDashboardApi = {
  // Get affiliate dashboard stats
  async getDashboardStats(affiliateId: string): Promise<AffiliateDashboardStats> {
    // Get clients count
    const { count: total_clients } = await supabase
      .from('affiliate_clients')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId);

    const { count: active_clients } = await supabase
      .from('affiliate_clients')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId)
      .eq('status', 'active');

    // Get commissions data
    const { data: commissions } = await supabase
      .from('affiliate_commissions')
      .select('commission_amount, payment_status, created_at')
      .eq('affiliate_id', affiliateId);

    const total_earnings = commissions?.filter(c => c.payment_status === 'paid')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
    const pending_commissions = commissions?.filter(c => c.payment_status === 'pending')
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

    // Get packages data
    const { count: packages_purchased } = await supabase
      .from('affiliate_packages')
      .select('*', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId);

    const { data: packages } = await supabase
      .from('affiliate_packages')
      .select('total_dishes, total_images, dishes_used, images_used')
      .eq('affiliate_id', affiliateId)
      .eq('status', 'active');

    const packages_remaining = packages?.reduce((sum, p) => {
      const remaining_dishes = p.total_dishes - p.dishes_used;
      const remaining_images = p.total_images - p.images_used;
      return sum + (remaining_dishes > 0 || remaining_images > 0 ? 1 : 0);
    }, 0) || 0;

    // Calculate monthly earnings
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const this_month_earnings = commissions?.filter(c => 
      c.payment_status === 'paid' && new Date(c.created_at) >= thisMonthStart
    ).reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

    const last_month_earnings = commissions?.filter(c => 
      c.payment_status === 'paid' && 
      new Date(c.created_at) >= lastMonthStart && 
      new Date(c.created_at) <= lastMonthEnd
    ).reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

    return {
      total_clients: total_clients || 0,
      active_clients: active_clients || 0,
      total_earnings,
      pending_commissions,
      packages_purchased: packages_purchased || 0,
      packages_remaining,
      this_month_earnings,
      last_month_earnings
    };
  }
}; 