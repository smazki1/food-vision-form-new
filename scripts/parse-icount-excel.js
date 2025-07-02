#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration (using service_role key to bypass RLS)
const supabaseUrl = 'https://zjjzqsgflplzdamanhqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE3NTQ1NiwiZXhwIjoyMDYwNzUxNDU2fQ.9j_vOJEH_zUh7QXHb_VrKFYYOQzQ2cVJOL_5b-H8iGo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Package detection function
function detectPackageFromAmount(amount) {
  const amountNum = parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
  
  if (amountNum >= 1650) return 'Deluxe';
  if (amountNum >= 950) return 'Full Menu';
  if (amountNum >= 500) return 'Tasting';
  
  return 'Custom';
}

// Parse invoice number
function parseInvoiceNumber(invoiceRef) {
  if (!invoiceRef) return null;
  
  // Extract number from various formats
  const match = invoiceRef.toString().match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

// Main parsing function
async function parseExcelFile(filePath) {
  try {
    console.log(`📊 מנתח קובץ Excel: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`הקובץ לא נמצא: ${filePath}`);
    }

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📋 נמצאו ${data.length} שורות`);

    let processed = 0;
    let errors = [];

    for (const row of data) {
      try {
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) continue;

        // Extract data from row (adjust field names based on actual Excel export)
        const invoiceNumber = parseInvoiceNumber(
          row['מספר חשבונית'] || 
          row['Invoice Number'] || 
          row['מס חשבונית'] ||
          row['מספר'] ||
          Object.values(row)[0]
        );

        const clientName = 
          row['שם לקוח'] || 
          row['Client Name'] || 
          row['לקוח'] ||
          row['שם'] ||
          'לא ידוע';

        const clientEmail = 
          row['אימייל'] || 
          row['Email'] || 
          row['דואל'] ||
          row['מייל'] ||
          '';

        const amount = 
          row['סכום'] || 
          row['Amount'] || 
          row['סה"כ'] ||
          row['Total'] ||
          0;

        const date = 
          row['תאריך'] || 
          row['Date'] || 
          row['תאריך חשבונית'] ||
          new Date().toISOString().split('T')[0];

        const status = 
          row['סטטוס'] || 
          row['Status'] || 
          'paid'; // assume paid if status not specified

        // Skip if no invoice number or amount
        if (!invoiceNumber || !amount) {
          console.log(`⚠️ מדלג על שורה ללא מספר חשבונית או סכום:`, row);
          continue;
        }

        // Only process paid invoices
        if (status.toLowerCase().includes('paid') || 
            status.includes('שולם') || 
            status.includes('פעיל')) {

          const packageType = detectPackageFromAmount(amount);

          // Check if payment already exists
          const { data: existingPayment } = await supabase
            .from('icount_payments')
            .select('*')
            .eq('icount_doc_id', invoiceNumber.toString())
            .single();

          if (existingPayment) {
            console.log(`⚠️ תשלום כבר קיים עבור חשבונית ${invoiceNumber}`);
            continue;
          }

          // Insert new payment (match icount_payments table schema)
          const { data: newPayment, error } = await supabase
            .from('icount_payments')
            .insert([{
              icount_doc_id: invoiceNumber.toString(),
              icount_doc_type: 'invoice',
              payment_amount: parseFloat(amount.toString().replace(/[^0-9.]/g, '')),
              customer_name: clientName,
              customer_email: clientEmail,
              payment_date: date,
              detected_package_type: packageType.toLowerCase(),
              status: 'pending',
              admin_notes: 'מיובא מ-Excel',
              webhook_payload: row,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) {
            console.error(`❌ שגיאה בהכנסת תשלום ${invoiceNumber}:`, error);
            errors.push({ invoiceNumber, error: error.message });
          } else {
            console.log(`✅ תשלום נוסף בהצלחה: חשבונית ${invoiceNumber}, ${clientName}, ₪${amount}, חבילה: ${packageType}`);
            processed++;
          }
        }

      } catch (rowError) {
        console.error(`❌ שגיאה בעיבוד שורה:`, rowError);
        errors.push({ row, error: rowError.message });
      }
    }

    console.log(`\n📊 סיכום ייבוא:`);
    console.log(`✅ תשלומים נוספו: ${processed}`);
    console.log(`❌ שגיאות: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n🔍 פירוט שגיאות:`);
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.error}`);
      });
    }

    return { processed, errors };

  } catch (error) {
    console.error('❌ שגיאה כללית:', error);
    return { processed: 0, errors: [{ error: error.message }] };
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📊 כלי ייבוא תשלומים מ-Excel של iCount

שימוש:
  node parse-icount-excel.js <path-to-excel-file>

דוגמה:
  node parse-icount-excel.js ~/Downloads/icount-invoices.xlsx

הערות:
- הקובץ צריך להכיל עמודות: מספר חשבונית, שם לקוח, סכום, תאריך, סטטוס
- רק חשבוניות שולמו יובאו למערכת
- חבילות יזוהו אוטומטית לפי סכום: ₪550=Tasting, ₪990=Full Menu, ₪1690=Deluxe
`);
    process.exit(1);
  }

  const filePath = args[0];
  
  console.log('🚀 מתחיל ייבוא תשלומים מ-iCount Excel...');
  
  const result = await parseExcelFile(filePath);
  
  if (result.processed > 0) {
    console.log(`\n🎉 ייבוא הושלם בהצלחה! ${result.processed} תשלומים נוספו.`);
    console.log(`\n🔗 כעת תוכל לראות את התשלומים בממשק הניהול:`);
    console.log(`https://zjjzqsgflplzdamanhqj.supabase.co/project/zjjzqsgflplzdamanhqj/editor`);
  } else {
    console.log('\n❌ לא נוספו תשלומים חדשים.');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { parseExcelFile, detectPackageFromAmount }; 