// Debug script to test robust comments system
import { supabase } from '@/integrations/supabase/client';

export const testRobustComments = async (leadId: string) => {
  console.log('=== TESTING ROBUST COMMENTS ===');
  console.log('Lead ID:', leadId);
  
  // 1. Test RPC function directly
  try {
    console.log('\n1. Testing RPC function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('log_lead_activity', {
      p_lead_id: leadId,
      p_activity_description: 'תגובה: Test comment from debug script'
    });
    
    console.log('RPC result:', { data: rpcData, error: rpcError });
  } catch (error) {
    console.error('RPC error:', error);
  }
  
  // 2. Check all activities for this lead
  try {
    console.log('\n2. Fetching all activities...');
    const { data: allActivities, error: allError } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .order('activity_timestamp', { ascending: false });
      
    console.log('All activities:', allActivities);
    console.log('Activities error:', allError);
  } catch (error) {
    console.error('All activities error:', error);
  }
  
  // 3. Check comments specifically  
  try {
    console.log('\n3. Fetching comments with LIKE...');
    const { data: comments, error: commentsError } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .like('activity_description', 'תגובה:%')
      .order('activity_timestamp', { ascending: false });
      
    console.log('Comments with LIKE:', comments);
    console.log('Comments error:', commentsError);
  } catch (error) {
    console.error('Comments LIKE error:', error);
  }
  
  // 4. Check comments with ILIKE
  try {
    console.log('\n4. Fetching comments with ILIKE...');
    const { data: icomments, error: icommentsError } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .ilike('activity_description', 'תגובה:%')
      .order('activity_timestamp', { ascending: false });
      
    console.log('Comments with ILIKE:', icomments);
    console.log('Comments error:', icommentsError);
  } catch (error) {
    console.error('Comments ILIKE error:', error);
  }
  
  // 5. Check with different patterns
  try {
    console.log('\n5. Fetching comments with different patterns...');
    
    // Try starting with תגובה
    const { data: pattern1, error: error1 } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .textSearch('activity_description', 'תגובה')
      .order('activity_timestamp', { ascending: false });
      
    console.log('Pattern תגובה:', pattern1);
    
    // Try any comment-like activity
    const { data: pattern2, error: error2 } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .filter('activity_description', 'like', '%תגובה%')
      .order('activity_timestamp', { ascending: false });
      
    console.log('Pattern %תגובה%:', pattern2);
    
  } catch (error) {
    console.error('Pattern matching error:', error);
  }
  
  console.log('=== DEBUG COMPLETE ===');
};

// Call this from browser console: window.testRobustComments('your-lead-id')
(window as any).testRobustComments = testRobustComments; 