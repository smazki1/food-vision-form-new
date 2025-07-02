#!/bin/bash

# Manual Payment Entry Script
# Use this if iCount webhook isn't working

echo "🔧 Manual Payment Entry Tool"
echo "============================="

# Get payment details
read -p "Invoice/Doc ID: " doc_id
read -p "Payment Amount (₪): " amount
read -p "Customer Email: " email
read -p "Customer Name: " name

# Detect package type
if (( $(echo "$amount >= 1690" | bc -l) )); then
    package_type="deluxe"
    echo "📦 Auto-detected: Deluxe Package"
elif (( $(echo "$amount >= 990" | bc -l) )); then
    package_type="full_menu"
    echo "📦 Auto-detected: Full Menu Package"
elif (( $(echo "$amount >= 550" | bc -l) )); then
    package_type="tasting"
    echo "📦 Auto-detected: Tasting Package"
else
    package_type="tasting"
    echo "📦 Default: Tasting Package (low amount)"
fi

echo ""
echo "Adding payment to system..."

# Add payment via webhook
response=$(curl -X POST https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook \
  -H "X-iCount-Secret: 882F87C04676B449" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I" \
  -d "{\"doc_id\":\"$doc_id\",\"amount\":$amount,\"customer_email\":\"$email\",\"customer_name\":\"$name\",\"payment_date\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" \
  --silent)

if echo "$response" | grep -q "success"; then
    echo "✅ Payment added successfully!"
    echo "📍 Check your admin panel under Payment Approvals"
    echo "🔗 The payment is ready for approval and affiliate assignment"
else
    echo "❌ Error adding payment:"
    echo "$response"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Go to Admin Panel → Payment Approvals"
echo "2. Find your payment and assign to affiliate"
echo "3. Approve to create package automatically" 