export default async function handler(req, res) {
  console.log('=== WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log('Rejected: Method not POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log all headers to see what iCount sends
  console.log('All headers:', JSON.stringify(req.headers, null, 2));

  // Verify iCount secret header (case-insensitive)
  const icountSecret = req.headers['x-icount-secret'] || req.headers['X-iCount-Secret'] || req.headers['X-ICOUNT-SECRET'];
  const expectedSecret = '882F87C04676B449';
  
  console.log('Received secret:', icountSecret);
  console.log('Expected secret:', expectedSecret);
  
  if (icountSecret !== expectedSecret) {
    console.error('Invalid X-iCount-Secret:', icountSecret);
    // For now, let's allow the webhook to proceed for debugging
    console.log('WARNING: Proceeding despite invalid secret for debugging');
  }

  console.log('iCount webhook received:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  try {
    // Forward to Supabase function
    const response = await fetch('https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook-public', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Supabase error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Payment recorded successfully:', data);
    
    // Return success in format iCount expects
    return res.status(200).json({
      success: true,
      status: 'ok',
      message: 'Payment recorded'
    });

  } catch (error) {
    console.error('Webhook bridge error:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message 
    });
  }
} 