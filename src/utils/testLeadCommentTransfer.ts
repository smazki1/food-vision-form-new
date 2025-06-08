import { supabase } from '@/integrations/supabase/client';

interface CommentTransferTest {
  leadId: string;
  leadComments: Array<{
    activity_id: string;
    activity_description: string;
    activity_timestamp: string;
  }>;
  clientId?: string;
  clientComments?: Array<{
    id: string;
    text: string;
    timestamp: string;
    source: string;
  }>;
  success: boolean;
  error?: string;
}

export const testLeadCommentTransfer = async (leadId: string): Promise<CommentTransferTest> => {
  console.log('=== TESTING LEAD COMMENT TRANSFER ===');
  console.log('Lead ID:', leadId);

  const result: CommentTransferTest = {
    leadId,
    leadComments: [],
    success: false
  };

  try {
    // 1. Get lead comments before conversion
    console.log('\n1. Fetching lead comments before conversion...');
    const { data: leadActivities, error: leadError } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .order('activity_timestamp', { ascending: false });

    if (leadError) {
      result.error = `Failed to fetch lead activities: ${leadError.message}`;
      return result;
    }

    // Filter for comments (activities starting with "תגובה:")
    const leadComments = (leadActivities || []).filter(activity => 
      activity.activity_description.startsWith('תגובה:')
    );

    result.leadComments = leadComments;
    console.log('Lead comments found:', leadComments.length);
    leadComments.forEach(comment => {
      console.log(`- ${comment.activity_description} (${comment.activity_timestamp})`);
    });

    // 2. Check if lead is already converted
    console.log('\n2. Checking lead conversion status...');
    const { data: leadData, error: leadCheckError } = await supabase
      .from('leads')
      .select('lead_status, client_id')
      .eq('lead_id', leadId)
      .single();

    if (leadCheckError) {
      result.error = `Failed to check lead status: ${leadCheckError.message}`;
      return result;
    }

    console.log('Lead status:', leadData?.lead_status);
    console.log('Client ID:', leadData?.client_id);

    // 3. If converted, check client comments
    if (leadData?.client_id) {
      result.clientId = leadData.client_id;
      
      console.log('\n3. Fetching client internal_notes...');
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('internal_notes')
        .eq('client_id', leadData.client_id)
        .single();

      if (clientError) {
        result.error = `Failed to fetch client data: ${clientError.message}`;
        return result;
      }

      console.log('Client internal_notes raw:', clientData?.internal_notes);

      if (clientData?.internal_notes) {
        try {
          const parsed = JSON.parse(clientData.internal_notes);
          console.log('Parsed internal_notes:', parsed);
          
          if (parsed.clientComments && Array.isArray(parsed.clientComments)) {
            result.clientComments = parsed.clientComments;
            console.log('Client comments found:', parsed.clientComments.length);
            parsed.clientComments.forEach((comment: any) => {
              console.log(`- ${comment.text} (${comment.timestamp}) [source: ${comment.source}]`);
            });

            // Check if lead comments were transferred
            const leadCommentsInClient = parsed.clientComments.filter((c: any) => c.source === 'lead');
            console.log('Lead comments transferred to client:', leadCommentsInClient.length);
            
            if (leadCommentsInClient.length === leadComments.length) {
              result.success = true;
              console.log('✅ All lead comments successfully transferred!');
            } else {
              result.error = `Comment count mismatch: ${leadComments.length} lead comments vs ${leadCommentsInClient.length} transferred`;
            }
          } else {
            result.error = 'No clientComments array found in internal_notes';
          }
        } catch (e) {
          result.error = `Failed to parse internal_notes JSON: ${e}`;
        }
      } else {
        result.error = 'Client internal_notes is empty';
      }
    } else {
      result.error = 'Lead is not converted to client yet';
    }

  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`;
  }

  console.log('\n=== TEST RESULT ===');
  console.log('Success:', result.success);
  console.log('Error:', result.error);
  console.log('Lead comments:', result.leadComments.length);
  console.log('Client comments:', result.clientComments?.length || 0);
  console.log('===================');

  return result;
};

export const debugClientComments = async (clientId: string) => {
  console.log('=== DEBUGGING CLIENT COMMENTS ===');
  console.log('Client ID:', clientId);

  try {
    // Get client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('internal_notes, original_lead_id')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('Failed to fetch client:', clientError);
      return;
    }

    console.log('Original lead ID:', clientData?.original_lead_id);
    console.log('Internal notes raw:', clientData?.internal_notes);

    if (clientData?.internal_notes) {
      try {
        const parsed = JSON.parse(clientData.internal_notes);
        console.log('Parsed internal_notes structure:', Object.keys(parsed));
        console.log('Client comments:', parsed.clientComments);
        console.log('Lead notes:', parsed.leadNotes);
        console.log('Lead activities:', parsed.leadActivities);
        console.log('Converted from lead:', parsed.convertedFromLead);
      } catch (e) {
        console.log('JSON parse error:', e);
        console.log('Treating as plain text:', clientData.internal_notes);
      }
    }

    // If there's an original lead, check its comments too
    if (clientData?.original_lead_id) {
      console.log('\n--- Checking original lead comments ---');
      const { data: leadActivities, error: leadError } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', clientData.original_lead_id)
        .order('activity_timestamp', { ascending: false });

      if (!leadError && leadActivities) {
        const leadComments = leadActivities.filter(activity => 
          activity.activity_description.startsWith('תגובה:')
        );
        console.log('Original lead comments:', leadComments.length);
        leadComments.forEach(comment => {
          console.log(`- ${comment.activity_description} (${comment.activity_timestamp})`);
        });
      }
    }

  } catch (error) {
    console.error('Debug error:', error);
  }

  console.log('=== DEBUG COMPLETE ===');
};

export const forceCommentSync = async (clientId: string) => {
  console.log('=== FORCING COMMENT SYNC ===');
  console.log('Client ID:', clientId);

  try {
    // Get client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('internal_notes, original_lead_id')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('Failed to fetch client:', clientError);
      return false;
    }

    if (!clientData?.original_lead_id) {
      console.log('No original lead ID - nothing to sync');
      return false;
    }

    // Get lead comments
    const { data: leadActivities, error: leadError } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', clientData.original_lead_id)
      .order('activity_timestamp', { ascending: false });

    if (leadError) {
      console.error('Failed to fetch lead activities:', leadError);
      return false;
    }

    const leadComments = (leadActivities || []).filter(activity => 
      activity.activity_description.startsWith('תגובה:')
    ).map(activity => ({
      id: activity.activity_id,
      text: activity.activity_description.replace('תגובה: ', ''),
      timestamp: activity.activity_timestamp,
      source: 'lead'
    }));

    console.log('Found lead comments to sync:', leadComments.length);

    // Parse existing client data
    let existingData: any = {};
    if (clientData?.internal_notes) {
      try {
        existingData = JSON.parse(clientData.internal_notes);
      } catch (e) {
        existingData = { originalNotes: clientData.internal_notes };
      }
    }

    // Get existing client comments (non-lead)
    const existingClientComments = (existingData.clientComments || []).filter((c: any) => c.source !== 'lead');

    // Merge lead comments with existing client comments
    const mergedComments = [...leadComments, ...existingClientComments];

    // Update client data
    const updatedData = {
      ...existingData,
      clientComments: mergedComments,
      lastCommentSync: new Date().toISOString(),
      syncedFromLead: clientData.original_lead_id
    };

    const { error: updateError } = await supabase
      .from('clients')
      .update({ 
        internal_notes: JSON.stringify(updatedData),
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    if (updateError) {
      console.error('Failed to update client:', updateError);
      return false;
    }

    console.log('✅ Comment sync completed successfully');
    console.log('Synced comments:', mergedComments.length);
    return true;

  } catch (error) {
    console.error('Force sync error:', error);
    return false;
  }
}; 