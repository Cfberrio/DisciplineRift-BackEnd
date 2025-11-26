# Email Marketing System

## Overview

A simple email marketing system for sending newsletters to Newsletter table subscribers with batch sending, test emails, preview, and one-click unsubscribe functionality.

## Features

- ✅ Compose newsletters with HTML content
- ✅ Preview emails before sending
- ✅ Send test emails to verify formatting
- ✅ Batch send to all Newsletter subscribers
- ✅ One-click unsubscribe (deletes record)
- ✅ Retry logic with exponential backoff
- ✅ List-Unsubscribe headers for better deliverability
- ✅ Concurrency control and rate limiting

## Architecture

### Files Created

#### Backend (API)
- `app/api/email-marketing/test/route.ts` - Send test emails
- `app/api/email-marketing/send/route.ts` - Send to all subscribers
- `app/api/email-marketing/unsubscribe/route.ts` - Unsubscribe handler
- `app/api/email-marketing/subscribers/route.ts` - Get subscriber count

#### Utility
- `lib/mailer/newsletter-mailer.ts` - Email sending utilities with retry logic

#### Frontend (UI)
- `app/email-marketing/page.tsx` - Main landing page
- `app/email-marketing/compose/page.tsx` - Compose newsletter form

#### Navigation
- Updated `components/sidebar.tsx` - Added "Newsletter" menu item

## Environment Variables

Required variables (add to `.env.local`):

```env
# Email Configuration (existing)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Optional: Customize batch sending behavior
BATCH_SIZE=50                    # Number of emails per batch
CONCURRENCY=3                    # Concurrent emails per batch
DELAY_BETWEEN_BATCH_MS=5000      # Delay between batches (milliseconds)

# Application URL for unsubscribe links
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Unsubscribe base URL (takes precedence over NEXT_PUBLIC_APP_URL)
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com

# Optional: Unsubscribe token secret
UNSUBSCRIBE_SECRET=your-secret-key-here
```

## How It Works

### 1. Token Generation

When sending emails, a secure unsubscribe token is generated for each recipient:
- Token = base64(email:timestamp:hmac)
- HMAC ensures the token hasn't been tampered with
- Token is included in the unsubscribe URL

### 2. Batch Sending

Emails are sent in controlled batches to avoid rate limits:
- Fetches all records from Newsletter table
- Filters valid emails and removes duplicates
- Splits into batches (default: 50 emails per batch)
- Processes with concurrency limit (default: 3 simultaneous sends)
- Delays between batches (default: 5 seconds)

### 3. Retry Logic

Each email send attempt includes retry logic:
- Maximum 3 retry attempts
- Exponential backoff: 5s, 15s, 45s
- Aborts immediately on authentication errors (EAUTH)
- Continues with other emails if one fails

### 4. Email Headers

Each email includes deliverability headers:
```
List-Unsubscribe: <https://domain.com/api/email-marketing/unsubscribe?token=...>, <mailto:unsubscribe@disciplinerift.com?subject=unsubscribe>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
List-ID: Newsletter.DisciplineRift
```

## Usage

### Access the System

Navigate to the "Newsletter" menu item in the sidebar or go to `/email-marketing`.

### Compose a Newsletter

1. Click "Compose Newsletter"
2. Fill in the form:
   - **Campaign Title**: Internal reference (optional)
   - **Email Subject**: Subject line (required)
   - **From Name**: Sender name (required)
   - **From Email**: Sender email address (required)
   - **Email Content (HTML)**: HTML body of the email (required)
   - **Plain Text Alternative**: Plain text version (optional, auto-generated if empty)

### Preview

1. Click "Preview" button
2. Review how the email will appear to recipients
3. Check subject, sender info, and content formatting

### Send Test Emails

1. Click "Send Test" button
2. Enter test email addresses (comma-separated)
3. Click "Send Test"
4. Check your inbox for test emails
5. Verify formatting and unsubscribe link

### Send to All Subscribers

1. Ensure all fields are filled correctly
2. Click "Send to All Subscribers"
3. Confirm the action in the dialog
4. Wait for the sending process to complete
5. Review the results:
   - Total subscribers
   - Successfully sent
   - Failed sends

### Unsubscribe

Recipients can unsubscribe by:
1. Clicking the unsubscribe link in any newsletter
2. They'll see a confirmation page
3. Their record is deleted from the Newsletter table

## API Endpoints

### POST `/api/email-marketing/test`

Send test emails to specified addresses.

**Request Body:**
```json
{
  "title": "Test Campaign",
  "subject": "Test Subject",
  "from_name": "DisciplineRift",
  "from_email": "luis@disciplinerift.com",
  "html": "<h1>Hello World</h1>",
  "text_alt": "Hello World",
  "test_emails": ["test1@example.com", "test2@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test emails sent: 2 successful, 0 failed",
  "statistics": {
    "total": 2,
    "sent": 2,
    "failed": 0
  },
  "results": [
    {
      "email": "test1@example.com",
      "success": true,
      "messageId": "..."
    }
  ]
}
```

### POST `/api/email-marketing/send`

Send newsletter to all Newsletter subscribers.

**Request Body:**
```json
{
  "title": "Monthly Newsletter",
  "subject": "Updates from DisciplineRift",
  "from_name": "DisciplineRift Team",
  "from_email": "luis@disciplinerift.com",
  "html": "<h1>Newsletter Content</h1>",
  "text_alt": "Newsletter Content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Newsletter sent to 150 subscribers",
  "statistics": {
    "total": 150,
    "sent": 148,
    "failed": 2
  },
  "errors": [
    {
      "email": "invalid@...",
      "error": "Invalid email format"
    }
  ]
}
```

### GET `/api/email-marketing/unsubscribe?token=...`

Unsubscribe handler - deletes subscriber record.

**Response:** HTML page confirming unsubscription

### GET `/api/email-marketing/subscribers`

Get total subscriber count.

**Response:**
```json
{
  "success": true,
  "count": 150
}
```

## Testing Checklist

### 1. Preview Test
- [ ] Navigate to `/email-marketing/compose`
- [ ] Fill in all required fields
- [ ] Click "Preview"
- [ ] Verify email renders correctly
- [ ] Check subject and sender information

### 2. Test Send
- [ ] Enter 2 test email addresses
- [ ] Click "Send Test"
- [ ] Check both inboxes
- [ ] Verify emails arrive with correct formatting
- [ ] Check for List-Unsubscribe header (view email source)
- [ ] Verify unsubscribe link is present

### 3. Batch Send
- [ ] Ensure Newsletter table has 5+ test subscribers
- [ ] Compose a test newsletter
- [ ] Click "Send to All Subscribers"
- [ ] Confirm the action
- [ ] Wait for completion
- [ ] Verify success/failure counts are accurate
- [ ] Check a few subscriber inboxes

### 4. Unsubscribe Flow
- [ ] Click unsubscribe link from a received email
- [ ] Verify confirmation page appears
- [ ] Check Newsletter table - record should be deleted
- [ ] Try to send another newsletter - unsubscribed email should not receive it

### 5. Batch Settings
- [ ] Set BATCH_SIZE=2 in .env.local
- [ ] Set CONCURRENCY=1 in .env.local
- [ ] Send to 5 subscribers
- [ ] Monitor console logs for batch processing
- [ ] Verify delays between batches

## Database

### Newsletter Table

Expected structure:
```sql
CREATE TABLE "Newsletter" (
  email TEXT PRIMARY KEY,
  -- other columns as needed
)
```

The system:
- Reads all records from Newsletter table
- Filters for valid email addresses
- Removes duplicates based on email
- Does NOT check for a "status" column (existence = subscribed)
- Deletes record on unsubscribe

## Security

### Token Security
- Tokens use HMAC-SHA256 for integrity
- Tokens include timestamp to track age
- Secret key should be set in UNSUBSCRIBE_SECRET env var
- Tokens are single-use (record deleted after unsubscribe)

### Email Validation
- Validates email format before sending
- Removes invalid emails from send list
- No PII logged (only counts, not email addresses)

### Rate Limiting
- Batch size limits prevent overwhelming SMTP server
- Concurrency control prevents connection exhaustion
- Delays between batches respect rate limits

## Troubleshooting

### Email Configuration Error
**Error:** "Gmail credentials not configured"
**Solution:** Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in .env.local

### Authentication Failed
**Error:** "Authentication failed" / EAUTH
**Solution:** 
1. Verify Gmail App Password is correct
2. Ensure 2FA is enabled on Gmail account
3. Generate new App Password if needed

### No Subscribers Found
**Error:** "No subscribers found"
**Solution:** 
1. Check Newsletter table has records
2. Verify table name is "Newsletter" (capital N)
3. Ensure email column exists and has valid emails

### Unsubscribe Link Invalid
**Error:** "Invalid Token"
**Solution:**
1. Ensure UNSUBSCRIBE_SECRET matches between send and unsubscribe
2. Token may have been corrupted in transit
3. Check NEXT_PUBLIC_APP_URL is correct

### Sending Takes Too Long
**Issue:** Batch sending is slow
**Solution:**
1. Increase CONCURRENCY (e.g., 5)
2. Decrease DELAY_BETWEEN_BATCH_MS (e.g., 2000)
3. Be careful not to exceed Gmail's rate limits (500 emails/day for free accounts)

## Rollback

To remove this feature completely:

```bash
# Delete directories
rm -rf app/email-marketing
rm -rf app/api/email-marketing
rm -rf lib/mailer

# Revert sidebar changes
# Remove "Newsletter" entry from components/sidebar.tsx
```

Or use git:
```bash
git checkout components/sidebar.tsx
```

## Future Enhancements

Potential improvements (not included in current scope):
- Campaign history and logging
- Scheduling newsletters for future dates
- Template library
- Rich text editor (WYSIWYG)
- A/B testing
- Analytics and open tracking
- Segment subscribers by interest
- Import/export subscriber lists
- Bounce handling
- SPF/DKIM verification

## Support

For issues or questions:
1. Check environment variables are set correctly
2. Review console logs for detailed error messages
3. Verify Newsletter table structure
4. Test with a small batch first (2-3 subscribers)
5. Check Gmail account hasn't hit daily sending limits

