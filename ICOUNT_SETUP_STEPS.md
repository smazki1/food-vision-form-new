# 🔧 iCount Webhook Configuration - Step by Step

## 🎯 **YOUR WEBHOOK URL**
```
https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook
```

## 📋 **STEP-BY-STEP CONFIGURATION**

### **1. Login to iCount Admin**
- Go to your iCount admin panel
- Navigate to **Settings** or **API Settings**

### **2. Find Webhooks Section**
Look for one of these menu items:
- **Webhooks**
- **API Integration** 
- **Notifications**
- **External Systems**

### **3. Add New Webhook**
**URL:** `https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook`

**Method:** `POST`

**Headers to Add:**
```
X-iCount-Secret: 882F87C04676B449
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I
Content-Type: application/json
```

### **4. Enable Events**
Check ALL these events:
- ✅ **Payment Completed**
- ✅ **Invoice Paid**
- ✅ **Payment Received** 
- ✅ **Transaction Completed**
- ✅ **Payment Success**

### **5. Test Webhook**
- Find **Test** or **Send Test** button
- Click to send test notification
- Check your admin panel for test payment

### **6. Activate Webhook**
- Make sure webhook is **Active/Enabled**
- Save configuration

---

## 🧪 **IMMEDIATE TEST**

**Option 1: Use Script**
```bash
./scripts/add-payment-manually.sh
```

**Option 2: Send me details**
Reply with:
- Invoice ID: `____`
- Amount: `____₪`
- Email: `____`
- Name: `____`

I'll add it directly to your system.

---

## ✅ **VERIFICATION**

After configuration:
1. Make small test payment in iCount
2. Check admin panel within 30 seconds
3. Payment should appear automatically

**If still not working:** Contact iCount support with our webhook URL and ask them to verify configuration. 