# 🎯 iCount Final Configuration

## **WEBHOOK URL**
```
https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook
```

## **EXACT CONFIGURATION STEPS**

### **Step 1: iCount Admin Panel**
1. Login to iCount
2. Go to **Settings** → **Integrations** or **API**
3. Find **Webhooks** section

### **Step 2: Create New Webhook**
**URL**: `https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook`
**Method**: `POST`

**Required Headers**:
```
X-iCount-Secret: 882F87C04676B449
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I
Content-Type: application/json
```

### **Step 3: Enable Events**
✅ **Payment Completed**
✅ **Invoice Paid** 
✅ **Transaction Success**
✅ **Payment Received**

### **Step 4: Activate & Test**
- Set webhook to **Active**
- Click **Test** button
- Verify test payment appears in admin panel

---

## **VERIFICATION**

After configuration:
1. Make any payment in iCount
2. Payment automatically appears in admin panel within 30 seconds
3. Admin can assign to correct affiliate and approve

## **PACKAGE AUTO-DETECTION**
- ₪550 → Tasting Package (60 images, 12 dishes)
- ₪990 → Full Menu (150 images, 30 dishes)  
- ₪1690 → Deluxe Package (325 images, 65 dishes)

## **SUPPORT**
If webhook doesn't work after configuration, contact iCount support with webhook URL.

# iCount Automatic Payment Detection - Final Configuration

## ✅ Working Solution

Your webhook endpoint is now live and ready to receive payments automatically.

## 🔗 Webhook URL for iCount

```
https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook-public
```

## 📋 Configuration Steps in iCount

1. **Login to iCount**
2. **Go to Settings → Webhooks**
3. **Add New Webhook**:
   - URL: `https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook-public`
   - Method: `POST`
   - Events: Select "Invoice Paid" or "Payment Received"
   - Format: JSON or Form Data (both supported)
   - Headers: Add `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I`

## 🎯 How It Works

1. **Customer pays** through iCount
2. **iCount sends webhook** to your endpoint
3. **Payment automatically appears** in admin panel
4. **Admin assigns affiliate** and approves
5. **Affiliate package created** automatically

## 📊 Supported Data Fields

The webhook accepts these fields (in any format):
- `invoice_number`, `doc_id`, `document_id`, `id`, `invoice_id`
- `amount`, `total`, `sum`
- `customer_name`, `client_name`, `name`
- `customer_email`, `client_email`, `email`
- `payment_date`, `date`

## 🧪 Test Your Webhook

```bash
curl -X POST "https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook-public" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I" \
  -d '{
    "invoice_number": "5999",
    "amount": 990,
    "customer_name": "Test Customer",
    "customer_email": "test@example.com"
  }'
```

## 📱 Admin Panel

View payments: https://food-vision-affiliate-admin.vercel.app/admin/payment-approvals

## ✅ Package Detection

- **₪1690+** → Deluxe Package
- **₪990-1689** → Full Menu Package
- **₪550-989** → Tasting Package
- **Below ₪550** → Custom Package

## 🔥 That's It!

Every paid invoice in iCount will now automatically appear in your admin panel for approval. 