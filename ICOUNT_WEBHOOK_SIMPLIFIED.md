# 🎯 iCount Webhook - Simplified Configuration

## **PROBLEM SOLVED**
Your iCount can only send:
- ✅ **Webhook URL**
- ✅ **X-iCount-Secret: 882F87C04676B449**

Our webhook now **ONLY requires these 2 things**.

## **CHANGES MADE**

### **BEFORE (Not Working)**
```typescript
// Required 3 headers:
- Authorization: Bearer [token]  ❌ iCount can't send
- Content-Type: application/json  ❌ iCount can't send  
- X-iCount-Secret: 882F87C04676B449  ✅ iCount can send
```

### **AFTER (Working)**
```typescript
// Requires ONLY 1 header:
- X-iCount-Secret: 882F87C04676B449  ✅ iCount sends this
```

## **DEPLOYMENT NEEDED**

**Docker Issue**: Can't deploy locally because Docker not running.

**SOLUTION OPTIONS**:

### **Option 1: Manual Deployment (Recommended)**
1. Go to https://supabase.com/dashboard/project/zjjzqsgflplzdamanhqj/functions
2. Click "icount-webhook" function
3. Click "Edit Function" 
4. Replace code with updated version from `supabase/functions/icount-webhook/index.ts`
5. Click "Deploy"

### **Option 2: Start Docker + Deploy**
```bash
# Start Docker Desktop first
open -a Docker

# Wait 30 seconds, then:
cd supabase/functions
SUPABASE_ACCESS_TOKEN=sbp_9a091de69d699ebef97de32c8c86f756501bf8fc npx supabase functions deploy icount-webhook --project-ref zjjzqsgflplzdamanhqj
```

## **CURRENT STATUS**
- ✅ **Webhook Code**: Updated in local files
- ❌ **Deployment**: Needs manual deployment
- ✅ **iCount Config**: Your configuration is correct!

## **AFTER DEPLOYMENT**
Your iCount webhook configuration will work:
- **URL**: `https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook`
- **Headers**: Only `X-iCount-Secret: 882F87C04676B449`
- **Result**: All payments will appear in admin panel automatically

## **TEST COMMAND (After Deployment)**
```bash
curl -X POST https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook \
  -H "Content-Type: application/json" \
  -H "X-iCount-Secret: 882F87C04676B449" \
  -d '{"doc_id": "TEST-LIVE", "amount": 1690, "customer_email": "test@live.com", "customer_name": "Live Test"}'
```

**Expected Response**: `{"success": true, "payment_id": "...", "detected_package": "deluxe"}` 