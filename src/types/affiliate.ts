// Base affiliate types
export interface Affiliate {
  affiliate_id: string;
  user_auth_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  
  // Commission rates
  commission_rate_tasting: number;
  commission_rate_full_menu: number;
  commission_rate_deluxe: number;
  
  // Statistics
  total_earnings: number;
  total_referrals: number;
  
  created_at: string;
  updated_at: string;
}

export interface AffiliateClient {
  id: string;
  affiliate_id: string;
  client_id: string;
  referred_at: string | null;
  referral_source: string | null;
  referral_method: string | null;
  status: string | null;
}

export interface AffiliatePackage {
  package_id: string;
  affiliate_id: string;
  package_type: string;
  total_dishes: number;
  total_images: number;
  dishes_used: number;
  images_used: number;
  // These are calculated from the above
  used_dishes: number;
  used_images: number;
  remaining_dishes: number;
  remaining_images: number;
  purchase_price: number;
  purchased_at: string;
  status: string;
}

export interface AffiliatePackageAllocation {
  allocation_id: string;
  affiliate_package_id: string;
  client_id: string;
  allocated_dishes: number;
  allocated_images: number;
  dishes_used: number;
  images_used: number;
  allocated_at: string;
  status: string;
  // Aliases for compatibility
  dishes_allocated: number;
  images_allocated: number;
}

export interface AffiliateCommission {
  commission_id: string;
  affiliate_id: string;
  client_id: string;
  transaction_type: string;
  package_type: string | null;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_status: string;
  payment_date: string | null;
  payment_notes: string | null;
  created_at: string;
  // Aliases for compatibility
  amount: number;
  transaction_date: string;
  notes: string | null;
}

// Dashboard and stats types
export interface AffiliateDashboardStats {
  total_earnings: number;
  pending_commissions: number;
  total_clients: number;
  active_clients: number;
  packages_purchased: number;
  packages_remaining: number;
  this_month_earnings: number;
  last_month_earnings: number;
}

// Form types for creating/updating
export interface CreateAffiliateForm {
  name: string;
  email: string;
  phone?: string;
  commission_rate_tasting?: number;
  commission_rate_full_menu?: number;
  commission_rate_deluxe?: number;
}

export interface LinkClientToAffiliateForm {
  client_id: string;
  affiliate_id: string;
  referral_source?: string;
  referral_method?: string;
}

export interface PurchasePackageForm {
  affiliate_id: string;
  package_type: 'tasting' | 'full_menu' | 'deluxe';
  quantity: number;
}

export interface AllocatePackageForm {
  affiliate_package_id: string;
  client_id: string;
  dishes_allocated: number;
  images_allocated: number;
}

// Combined types for complex queries
export interface ClientWithAffiliate {
  client_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  // Use actual client table fields
  restaurant_name?: string;
  contact_name?: string;
  affiliate?: {
    affiliate_id: string;
    name: string;
    email: string;
  };
}

// Package pricing constants type
export interface PackageInfo {
  dishes: number;
  images: number;
  price: number;
  commission_rate: number;
}

export type AffiliateRole = 'affiliate'; 