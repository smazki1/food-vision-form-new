import { testLeadCommentTransfer, debugClientComments, forceCommentSync } from '@/utils/testLeadCommentTransfer';
import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive Comment Synchronization Test Suite
 * 
 * This test verifies that when a lead is converted to a client,
 * all comments and notes are properly transferred and accessible in the client view.
 */

interface TestResult {
  testName: string;
  success: boolean;
  details: string;
  data?: any;
  error?: string;
}

export const runCommentSynchronizationTests = async (): Promise<TestResult[]> => {
  console.log('🧪 STARTING COMMENT SYNCHRONIZATION TESTS');
  const results: TestResult[] = [];

  // Test 1: Check if we have any converted leads
  const test1 = await checkConvertedLeads();
  results.push(test1);

  if (test1.success && test1.data?.length > 0) {
    const convertedLead = test1.data[0];
    
    // Test 2: Test comment transfer for first converted lead
    const test2 = await testCommentTransfer(convertedLead.lead_id);
    results.push(test2);
    
    if (convertedLead.client_id) {
      // Test 3: Debug client comments
      const test3 = await testClientCommentDebug(convertedLead.client_id);
      results.push(test3);
      
      // Test 4: Test force sync
      const test4 = await testForceCommentSync(convertedLead.client_id);
      results.push(test4);
      
      // Test 5: Verify sync worked
      const test5 = await verifyCommentSync(convertedLead.client_id);
      results.push(test5);
    }
  }

  // Test 6: Check convert_lead_to_client function
  const test6 = await checkConvertFunction();
  results.push(test6);

  console.log('🏁 COMMENT SYNCHRONIZATION TESTS COMPLETE');
  console.table(results.map(r => ({
    Test: r.testName,
    Status: r.success ? '✅ PASS' : '❌ FAIL',
    Details: r.details
  })));

  return results;
};

const checkConvertedLeads = async (): Promise<TestResult> => {
  try {
    console.log('📋 Test 1: Checking for converted leads...');
    
    const { data: leads, error } = await supabase
      .from('leads')
      .select('lead_id, restaurant_name, lead_status, client_id')
      .eq('lead_status', 'הפך ללקוח')
      .limit(5);

    if (error) {
      return {
        testName: 'Check Converted Leads',
        success: false,
        details: `Database error: ${error.message}`,
        error: error.message
      };
    }

    console.log('Found converted leads:', leads?.length || 0);
    leads?.forEach(lead => {
      console.log(`- ${lead.restaurant_name} (Lead: ${lead.lead_id} → Client: ${lead.client_id})`);
    });

    return {
      testName: 'Check Converted Leads',
      success: true,
      details: `Found ${leads?.length || 0} converted leads`,
      data: leads
    };

  } catch (error: any) {
    return {
      testName: 'Check Converted Leads',
      success: false,
      details: `Unexpected error: ${error.message}`,
      error: error.message
    };
  }
};

const testCommentTransfer = async (leadId: string): Promise<TestResult> => {
  try {
    console.log('💬 Test 2: Testing comment transfer...');
    
    const result = await testLeadCommentTransfer(leadId);
    
    return {
      testName: 'Comment Transfer Test',
      success: result.success,
      details: result.error || `Lead: ${result.leadComments.length} comments, Client: ${result.clientComments?.length || 0} comments`,
      data: result
    };

  } catch (error: any) {
    return {
      testName: 'Comment Transfer Test',
      success: false,
      details: `Test failed: ${error.message}`,
      error: error.message
    };
  }
};

const testClientCommentDebug = async (clientId: string): Promise<TestResult> => {
  try {
    console.log('🔍 Test 3: Running client comment debug...');
    
    await debugClientComments(clientId);
    
    return {
      testName: 'Client Comment Debug',
      success: true,
      details: 'Debug completed - check console for details'
    };

  } catch (error: any) {
    return {
      testName: 'Client Comment Debug',
      success: false,
      details: `Debug failed: ${error.message}`,
      error: error.message
    };
  }
};

const testForceCommentSync = async (clientId: string): Promise<TestResult> => {
  try {
    console.log('🔄 Test 4: Testing force comment sync...');
    
    const success = await forceCommentSync(clientId);
    
    return {
      testName: 'Force Comment Sync',
      success,
      details: success ? 'Force sync completed successfully' : 'Force sync failed'
    };

  } catch (error: any) {
    return {
      testName: 'Force Comment Sync',
      success: false,
      details: `Sync failed: ${error.message}`,
      error: error.message
    };
  }
};

const verifyCommentSync = async (clientId: string): Promise<TestResult> => {
  try {
    console.log('✅ Test 5: Verifying comment sync...');
    
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('internal_notes, original_lead_id')
      .eq('client_id', clientId)
      .single();

    if (error) {
      return {
        testName: 'Verify Comment Sync',
        success: false,
        details: `Failed to fetch client: ${error.message}`,
        error: error.message
      };
    }

    let syncStatus = 'No internal_notes found';
    let commentCount = 0;
    let leadCommentCount = 0;

    if (clientData?.internal_notes) {
      try {
        const parsed = JSON.parse(clientData.internal_notes);
        if (parsed.clientComments && Array.isArray(parsed.clientComments)) {
          commentCount = parsed.clientComments.length;
          leadCommentCount = parsed.clientComments.filter((c: any) => c.source === 'lead').length;
          syncStatus = `Found ${commentCount} total comments (${leadCommentCount} from lead)`;
        } else {
          syncStatus = 'No clientComments array found';
        }
      } catch (e) {
        syncStatus = 'Failed to parse internal_notes JSON';
      }
    }

    return {
      testName: 'Verify Comment Sync',
      success: commentCount > 0,
      details: syncStatus,
      data: { commentCount, leadCommentCount }
    };

  } catch (error: any) {
    return {
      testName: 'Verify Comment Sync',
      success: false,
      details: `Verification failed: ${error.message}`,
      error: error.message
    };
  }
};

const checkConvertFunction = async (): Promise<TestResult> => {
  try {
    console.log('🔧 Test 6: Checking convert_lead_to_client function...');
    
    // Try to call the function with a dummy UUID to see if it exists
    const { error } = await supabase.rpc('convert_lead_to_client', {
      p_lead_id: '00000000-0000-0000-0000-000000000000'
    });

    // If the function exists, we'll get a proper error about the lead not being found
    // If the function doesn't exist, we'll get a function not found error
    
    if (error?.message.includes('function') && error?.message.includes('does not exist')) {
      return {
        testName: 'Check Convert Function',
        success: false,
        details: 'convert_lead_to_client function does not exist',
        error: error.message
      };
    }

    // Any other error (like "Lead not found") means the function exists
    return {
      testName: 'Check Convert Function',
      success: true,
      details: 'convert_lead_to_client function exists and is callable'
    };

  } catch (error: any) {
    return {
      testName: 'Check Convert Function',
      success: false,
      details: `Function check failed: ${error.message}`,
      error: error.message
    };
  }
};

// Utility function to run a quick test
export const quickCommentTest = async () => {
  console.log('🚀 RUNNING QUICK COMMENT TEST');
  
  try {
    // Find a converted lead
    const { data: leads, error } = await supabase
      .from('leads')
      .select('lead_id, client_id, restaurant_name')
      .eq('lead_status', 'הפך ללקוח')
      .not('client_id', 'is', null)
      .limit(1);

    if (error || !leads || leads.length === 0) {
      console.log('❌ No converted leads found for testing');
      return;
    }

    const lead = leads[0];
    console.log(`📝 Testing with: ${lead.restaurant_name} (Lead: ${lead.lead_id} → Client: ${lead.client_id})`);
    
    // Test the transfer
    const result = await testLeadCommentTransfer(lead.lead_id);
    console.log('📊 Test Result:', result.success ? '✅ PASS' : '❌ FAIL');
    console.log('📋 Details:', result.error || `${result.leadComments.length} lead comments → ${result.clientComments?.length || 0} client comments`);

    if (!result.success && result.clientId) {
      console.log('🔄 Attempting force sync...');
      const syncResult = await forceCommentSync(result.clientId);
      console.log('🔄 Force sync:', syncResult ? '✅ SUCCESS' : '❌ FAILED');
    }

  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).runCommentTests = runCommentSynchronizationTests;
  (window as any).quickCommentTest = quickCommentTest;
  (window as any).testLeadCommentTransfer = testLeadCommentTransfer;
  (window as any).debugClientComments = debugClientComments;
  (window as any).forceCommentSync = forceCommentSync;
} 