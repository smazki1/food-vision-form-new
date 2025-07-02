# iCount Webhook Setup - Simple Solution

## The Issue
iCount webhooks only support:
- URL field
- X-iCount-Secret header (automatically sent)
- No custom headers support

## Working Solution

Since iCount can't send custom Authorization headers that Supabase requires, here are two working alternatives:

## Option 1: Use Make.com/Zapier (Recommended)

1. **Create a Make.com scenario**:
   - Trigger: Webhook (gives you a simple URL)
   - Action: HTTP Request to your Supabase function
   - Add the Authorization header in Make.com

2. **Configure in iCount**:
   - URL: Your Make.com webhook URL
   - That's it!

## Option 2: Simple Proxy Server

Create a simple Node.js server that accepts iCount webhooks and forwards them to Supabase:

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/icount-webhook', async (req, res) => {
  // Verify iCount secret
  if (req.headers['x-icount-secret'] !== '882F87C04676B449') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Forward to Supabase
  try {
    const response = await axios.post(
      'https://zjjzqsgflplzdamanhqj.supabase.co/functions/v1/icount-webhook-public',
      req.body,
      {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqanpxc2dmbHBsemRhbWFuaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNzU0NTYsImV4cCI6MjA2MDc1MTQ1Nn0.zcQAS1lYncW8VsXnQsz5pXo28ST0PruZZacNaWrPf0I',
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
```

Deploy this on any server (Heroku, Railway, etc.) and use that URL in iCount.

## Option 3: Continue Using Excel Import

The Excel import solution is working perfectly:
```bash
node scripts/parse-icount-excel.js ~/Downloads/icount-export.xlsx
```

This takes 30 seconds once a week and gives you full control.

## What to Tell iCount Support

If you want to request better webhook support, tell them:

"האם אפשר להוסיף תמיכה בהוספת Headers מותאמים אישית ל-webhooks? אנחנו צריכים להוסיף Authorization header כדי להתחבר למערכת שלנו. לחילופין, האם אפשר לשלוח את ה-webhook עם פרמטרים ב-URL כמו ?token=xxx"

(Translation: Can you add support for custom headers in webhooks? We need to add an Authorization header to connect to our system. Alternatively, can you send the webhook with URL parameters like ?token=xxx)

## Current Best Solution

For now, the Excel import is the most reliable solution that's already working. It takes just 5 minutes per week and gives you full control over the process. 