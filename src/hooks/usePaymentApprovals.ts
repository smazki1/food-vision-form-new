import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ICountPayment {
  payment_id: string;
  icount_doc_id: string;
  payment_amount: number;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  payment_date: string;
  detected_package_type?: 'tasting' | 'full_menu' | 'deluxe';
  affiliate_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  admin_notes?: string;
  created_at: string;
  webhook_payload: any;
}

export const usePaymentApprovals = () => {
  return useQuery({
    queryKey: ['payment-approvals'],
    queryFn: async (): Promise<ICountPayment[]> => {
      // Query real database
      const { data, error } = await supabase
        .from('icount_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      return data as ICountPayment[] || [];
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useApprovePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      affiliateId, 
      adminNotes 
    }: { 
      paymentId: string; 
      affiliateId: string; 
      adminNotes?: string; 
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('icount_payments')
        .update({
          status: 'approved',
          affiliate_id: affiliateId,
          admin_notes: adminNotes,
          assigned_at: new Date().toISOString(),
          assigned_by_admin: user.user?.id
        })
        .eq('payment_id', paymentId);

      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-approvals'] });
      toast.success('התשלום אושר בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Failed to approve payment:', error);
      toast.error(`שגיאה באישור התשלום: ${error.message}`);
    },
  });
};

export const useRejectPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      adminNotes 
    }: { 
      paymentId: string; 
      adminNotes?: string; 
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('icount_payments')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          assigned_at: new Date().toISOString(),
          assigned_by_admin: user.user?.id
        })
        .eq('payment_id', paymentId);

      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-approvals'] });
      toast.success('התשלום נדחה');
    },
    onError: (error: Error) => {
      console.error('Failed to reject payment:', error);
      toast.error(`שגיאה בדחיית התשלום: ${error.message}`);
    },
  });
};
