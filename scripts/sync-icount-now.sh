#!/bin/bash

# iCount Quick Sync Script
# Run this to sync all recent payments

echo "🔄 Syncing iCount payments..."

# You need to add your Company ID here
COMPANY_ID="YOUR_COMPANY_ID_HERE"
API_KEY="API3E8-C0A82A0C-669930F4-57D4FDD98BA1737A"

if [ "$COMPANY_ID" = "YOUR_COMPANY_ID_HERE" ]; then
  echo "❌ Please edit this script and add your Company ID"
  echo "   Look for COMPANY_ID= at the top of the file"
  exit 1
fi

# Get payments from last 24 hours
YESTERDAY=$(date -v-1d +%Y-%m-%d)

curl -X POST https://api.icount.co.il/api/v3.php/invoice/get_list \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"$API_KEY\",
    \"company_id\": \"$COMPANY_ID\",
    \"from_date\": \"$YESTERDAY\",
    \"status\": \"paid\"
  }" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log('Found', data.invoices?.length || 0, 'paid invoices');
data.invoices?.forEach(inv => {
  console.log('- Invoice', inv.doc_id, inv.client_name, '₪' + inv.total_price);
});
"

echo "✅ To add these to your system, provide your Company ID" 