#!/usr/bin/env node

/**
 * iCount Browser Sync Script
 * 
 * This script opens iCount in browser and syncs payments to your system.
 * Run this whenever you need to sync new payments.
 * 
 * Usage: node scripts/icount-browser-sync.js
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://zjjzqsgflplzdamanhqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I';

async function syncPayments() {
  console.log('🚀 Starting iCount payment sync...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for manual login
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to iCount
    console.log('📱 Opening iCount...');
    await page.goto('https://app.icount.co.il/');
    
    // Wait for manual login
    console.log('⏳ Please login to iCount manually...');
    console.log('   After login, press Enter to continue');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Navigate to invoices page
    console.log('📄 Navigating to invoices...');
    await page.goto('https://app.icount.co.il/he/invoices');
    await page.waitForSelector('table', { timeout: 30000 });
    
    // Extract invoice data
    console.log('🔍 Extracting invoice data...');
    const invoices = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const data = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 5) {
          const invoiceNumber = cells[1]?.textContent?.trim();
          const customerName = cells[2]?.textContent?.trim();
          const amount = cells[4]?.textContent?.replace(/[^\d.-]/g, '');
          const status = cells[5]?.textContent?.trim();
          
          if (invoiceNumber && amount && status?.includes('שולם')) {
            data.push({
              doc_id: invoiceNumber,
              customer_name: customerName,
              amount: parseFloat(amount),
              status: 'paid'
            });
          }
        }
      });
      
      return data;
    });
    
    console.log(`✅ Found ${invoices.length} paid invoices`);
    
    // Sync to database
    let synced = 0;
    for (const invoice of invoices) {
      try {
        // Check if already exists
        const checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/icount_payments?icount_doc_id=eq.${invoice.doc_id}`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        const existing = await checkResponse.json();
        
        if (!existing || existing.length === 0) {
          // Detect package type
          let packageType = null;
          if (invoice.amount >= 1690) packageType = 'deluxe';
          else if (invoice.amount >= 990) packageType = 'full_menu';
          else if (invoice.amount >= 550) packageType = 'tasting';
          
          // Insert new payment
          const insertResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/icount_payments`,
            {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                icount_doc_id: invoice.doc_id,
                customer_name: invoice.customer_name,
                payment_amount: invoice.amount,
                detected_package_type: packageType,
                status: 'pending',
                payment_date: new Date().toISOString(),
                webhook_payload: {},
                admin_notes: 'Synced from browser'
              })
            }
          );
          
          if (insertResponse.ok) {
            synced++;
            console.log(`✅ Synced: ${invoice.doc_id} - ${invoice.customer_name} - ₪${invoice.amount}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing ${invoice.doc_id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Sync complete! ${synced} new payments added.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    process.exit();
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  syncPayments();
} catch (e) {
  console.log('📦 Installing required dependencies...');
  require('child_process').execSync('npm install puppeteer node-fetch', { stdio: 'inherit' });
  console.log('✅ Dependencies installed. Please run the script again.');
} 