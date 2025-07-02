export default async function handler(req, res) {
  console.log('\n=== ICOUNT TEST WEBHOOK ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  
  // Log all headers
  console.log('\nHEADERS:');
  Object.entries(req.headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Log body
  console.log('\nBODY:');
  console.log(JSON.stringify(req.body, null, 2));
  
  // Always return success
  return res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Test webhook received',
    timestamp: new Date().toISOString()
  });
} 