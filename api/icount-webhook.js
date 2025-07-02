export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify iCount secret header
  const icountSecret = req.headers['x-icount-secret'];
  if (icountSecret !== '882F87C04676B449') {
    console.error('Invalid X-iCount-Secret:', icountSecret);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('iCount webhook received:', req.body);

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
    return res.status(200).json(data);

  } catch (error) {
    console.error('Webhook bridge error:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message 
    });
  }
} 