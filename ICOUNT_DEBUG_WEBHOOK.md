# iCount Webhook Debugging

## Steps to Debug:

1. **Check Vercel Logs**:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to "Functions" tab
   - Click on "api/icount-webhook"
   - Check the logs to see what iCount is sending

2. **Make a Test Payment in iCount**
   - Create a small test invoice
   - Mark it as paid
   - Check Vercel logs immediately

3. **What to Look For**:
   - Is the webhook being called at all?
   - What headers is iCount sending?
   - What is the body format?
   - Any error messages?

## Alternative Test:

Create a test endpoint on RequestBin:
1. Go to https://webhook.site
2. Copy your unique URL
3. Put that URL in iCount temporarily
4. Make a test payment
5. See exactly what iCount sends

This will show you the exact format of iCount's webhook data.

## Common Issues:

1. **Wrong field names**: iCount might use Hebrew field names or different structure
2. **Authentication**: The X-iCount-Secret might be in a different format
3. **Content-Type**: iCount might send form-data instead of JSON

## Once You Know the Format:

Share the webhook data you see in the logs, and I'll update the code to handle it correctly. 