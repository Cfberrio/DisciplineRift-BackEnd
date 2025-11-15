# Dual SMTP Provider Setup

## Overview

The email marketing system now supports **two SMTP providers**:

1. **Gmail SMTP** (`gmail`) - Default, for regular campaigns ≤500 emails/day
2. **Google Workspace SMTP Relay** (`relay`) - For bulk sending without daily limits

All existing functionality remains unchanged. By default, everything uses `gmail`.

## Architecture

### Files Modified/Created

```
lib/mailer/
├── providers.ts          (NEW) - Factory for creating transporters
├── newsletter-mailer.ts  (MODIFIED) - Now uses provider factory
└── index.ts              (NEW) - Re-exports all mailer functions

app/api/email-marketing/
├── test/route.ts         (MODIFIED) - Accepts optional provider parameter
├── send/route.ts         (MODIFIED) - Accepts optional provider parameter
└── verify-transports/route.ts (NEW) - Endpoint to verify both providers

app/email-marketing/
└── compose/page.tsx      (MODIFIED) - UI selector for provider
```

### Key Functions

**`createTransporter(provider?: 'gmail' | 'relay')`**
- Factory function that creates nodemailer transporter
- Default: `gmail` (backward compatible)
- Returns configured transporter for selected provider

**`verifyTransports()`**
- Tests both `gmail` and `relay` configurations
- Logs results: `[MAIL][gmail] OK/FAIL` and `[MAIL][relay] OK/FAIL`

**`sendNewsletterEmail({..., provider?: 'gmail' | 'relay'})`**
- Sends single email
- Optional `provider` parameter (defaults to `gmail`)

**`sendBatchNewsletters({..., provider?: 'gmail' | 'relay'})`**
- Sends batch emails
- Optional `provider` parameter (defaults to `gmail`)

## Environment Variables

Add to `.env.local`:

```env
# ==========================================
# Gmail SMTP (MANTENER - for ≤500 emails/day)
# ==========================================
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=465
GMAIL_USER=info@disciplinerift.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# ==========================================
# Workspace SMTP Relay (NUEVO - for bulk)
# ==========================================
RELAY_HOST=smtp-relay.gmail.com
RELAY_PORT=587
RELAY_REQUIRE_TLS=true
RELAY_USER=info@disciplinerift.com
RELAY_PASS=your-workspace-app-password

# ==========================================
# Default Provider (OPCIONAL)
# ==========================================
SMTP_PROVIDER_DEFAULT=gmail

# ==========================================
# Unsubscribe Configuration
# ==========================================
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com
UNSUBSCRIBE_SECRET=your-secret-key
```

**Important Notes:**
- Spaces in passwords are automatically removed
- Both `GMAIL_APP_PASSWORD` and `RELAY_PASS` are cleaned: `password.replace(/\s+/g, '')`
- If `SMTP_PROVIDER_DEFAULT` is not set, defaults to `gmail`
- `UNSUBSCRIBE_URL_BASE` takes precedence over `NEXT_PUBLIC_APP_URL` for unsubscribe links

## Setup Instructions

### Option 1: Gmail SMTP (Already configured)

You already have this configured. No changes needed.

**Limits:**
- 500 emails/day (free Gmail)
- 2,000 emails/day (Google Workspace with individual account)

### Option 2: Google Workspace SMTP Relay (NEW)

For bulk sending without daily limits.

#### Step 1: Enable SMTP Relay in Google Workspace

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to: **Apps** → **Google Workspace** → **Gmail**
3. Click **Routing** → **SMTP relay service**
4. Click **Add Another** or **Configure**
5. Settings:
   - **Allowed senders:** Select your domain or specific users
   - **Authentication:** Check "Require SMTP Authentication"
   - **Require TLS encryption:** Check this box
   - **IP addresses/ranges:** Leave blank or add your server IPs
6. Click **Save**

#### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already enabled)
3. Go to **App passwords**
4. Select app: **Mail**, device: **Other** (custom name: "SMTP Relay")
5. Click **Generate**
6. Copy the 16-character password (spaces will be auto-removed)

#### Step 3: Update `.env.local`

Add the relay configuration:

```env
RELAY_HOST=smtp-relay.gmail.com
RELAY_PORT=587
RELAY_REQUIRE_TLS=true
RELAY_USER=info@disciplinerift.com
RELAY_PASS=abcd efgh ijkl mnop  # Spaces are OK, auto-removed
```

#### Step 4: Verify Configuration

Visit: `http://localhost:3000/api/email-marketing/verify-transports`

Or run in code:
```typescript
import { verifyTransports } from '@/lib/mailer'

await verifyTransports()
// Console output:
// [MAIL][gmail] OK
// [MAIL][relay] OK
```

## Usage

### From UI (Compose Page)

1. Go to `/email-marketing/compose`
2. See new **"SMTP Provider"** dropdown
3. Options:
   - **Gmail SMTP (≤500 emails/day)** - Default
   - **Workspace Relay (bulk sending)** - For high volume
4. Select desired provider
5. Compose and send as usual

### From API

#### Test Emails

```bash
curl -X POST http://localhost:3000/api/email-marketing/test \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "subject": "Test Email",
    "from_name": "DisciplineRift",
    "from_email": "info@disciplinerift.com",
    "html": "<h1>Hello</h1>",
    "text_alt": "Hello",
    "test_emails": ["test@example.com"],
    "provider": "relay"
  }'
```

#### Send Newsletter

```bash
curl -X POST http://localhost:3000/api/email-marketing/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Monthly Newsletter",
    "subject": "Updates",
    "from_name": "DisciplineRift",
    "from_email": "info@disciplinerift.com",
    "html": "<h1>Newsletter</h1>",
    "text_alt": "Newsletter",
    "provider": "relay"
  }'
```

**Note:** Omit `provider` to use default (`gmail`)

### From Code

```typescript
import { sendNewsletterEmail } from '@/lib/mailer'

// Send with Gmail (default)
await sendNewsletterEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome</h1>',
  text: 'Welcome',
  fromName: 'DisciplineRift',
  fromEmail: 'info@disciplinerift.com',
  unsubscribeUrl: token,
  // provider not specified = uses 'gmail'
})

// Send with Relay
await sendNewsletterEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome</h1>',
  text: 'Welcome',
  fromName: 'DisciplineRift',
  fromEmail: 'info@disciplinerift.com',
  unsubscribeUrl: token,
  provider: 'relay', // <-- Explicitly use relay
})
```

## Backward Compatibility

✅ **All existing code works without changes**

- Any code calling `sendNewsletterEmail()` without `provider` uses `gmail`
- Any code calling `sendBatchNewsletters()` without `provider` uses `gmail`
- API endpoints accept optional `provider` parameter
- Default behavior unchanged

### Examples of Unchanged Behavior

```typescript
// This still works exactly as before (uses gmail)
await sendNewsletterEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
  text: 'Test',
  fromName: 'Test',
  fromEmail: 'test@example.com',
  unsubscribeUrl: 'token',
})

// This also still works (uses gmail)
await sendBatchNewsletters({
  subject: 'Newsletter',
  html: '<h1>Newsletter</h1>',
  text: 'Newsletter',
  fromName: 'DisciplineRift',
  fromEmail: 'info@disciplinerift.com',
  recipients: [{ email: 'user@example.com' }],
})
```

## Testing Checklist

### 1. Verify Configurations

```bash
# Visit endpoint
curl http://localhost:3000/api/email-marketing/verify-transports

# Check server logs for:
# [MAIL][gmail] OK
# [MAIL][relay] OK
```

### 2. Test Gmail Provider (Default)

```bash
# Send test email (should use gmail by default)
curl -X POST http://localhost:3000/api/email-marketing/test \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Gmail Test",
    "from_name": "Test",
    "from_email": "info@disciplinerift.com",
    "html": "<h1>Gmail Test</h1>",
    "text_alt": "Gmail Test",
    "test_emails": ["your-test@email.com"]
  }'
```

**Expected:**
- Email arrives
- Check email headers: should show `smtp.gmail.com`

### 3. Test Relay Provider

```bash
# Send test email with relay
curl -X POST http://localhost:3000/api/email-marketing/test \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Relay Test",
    "from_name": "Test",
    "from_email": "info@disciplinerift.com",
    "html": "<h1>Relay Test</h1>",
    "text_alt": "Relay Test",
    "test_emails": ["your-test@email.com"],
    "provider": "relay"
  }'
```

**Expected:**
- Email arrives
- Check email headers: should show `smtp-relay.gmail.com`

### 4. Test UI Selection

1. Go to `/email-marketing/compose`
2. Fill form
3. Select **"Gmail SMTP"** from dropdown
4. Send test → should use Gmail
5. Select **"Workspace Relay"** from dropdown
6. Send test → should use Relay

### 5. Test Backward Compatibility

Ensure existing code still works:

```typescript
// In your existing marketing/send-email route or any other code
// that uses sendNewsletterEmail without provider parameter
// Should still work without modifications
```

## Troubleshooting

### Error: "Gmail credentials not configured"

**Cause:** Missing `GMAIL_USER` or `GMAIL_APP_PASSWORD`

**Solution:**
```env
GMAIL_USER=info@disciplinerift.com
GMAIL_APP_PASSWORD=your-app-password
```

### Error: "Relay SMTP credentials not configured"

**Cause:** Missing `RELAY_USER` or `RELAY_PASS`

**Solution:**
```env
RELAY_USER=info@disciplinerift.com
RELAY_PASS=your-relay-password
```

### [MAIL][gmail] FAIL or [MAIL][relay] FAIL

**Check:**
1. Credentials are correct
2. No typos in email addresses
3. App passwords are valid (16 characters)
4. 2FA is enabled on Google account
5. SMTP relay is enabled in Google Workspace admin

**Debug:**
```bash
# Check which provider fails
curl http://localhost:3000/api/email-marketing/verify-transports

# Look at server logs for detailed error message
```

### Emails not sending with Relay

**Common causes:**
1. SMTP Relay not enabled in Google Workspace Admin
2. Authentication not required (check admin settings)
3. Domain or user not in "Allowed senders"
4. Invalid app password

**Solution:**
1. Verify admin settings (see Step 1 above)
2. Regenerate app password
3. Add your domain to allowed senders

### Authentication errors (EAUTH)

**Gmail:**
- Verify app password is correct
- Regenerate if needed

**Relay:**
- Check admin console: SMTP relay → Authentication required
- Verify app password for workspace account
- Ensure using workspace account (not personal Gmail)

## Comparison: Gmail vs Relay

| Feature | Gmail SMTP | Workspace Relay |
|---------|------------|-----------------|
| Daily Limit | 500 (free) / 2,000 (workspace) | Unlimited* |
| Port | 465 (SSL) | 587 (TLS) |
| Host | smtp.gmail.com | smtp-relay.gmail.com |
| Best For | Small campaigns | Bulk newsletters |
| Requires | App password | Workspace + SMTP relay setup |
| Cost | Free / $6-18/mo | Included with Workspace |

\* Subject to Google's fair use policy and abuse prevention

## When to Use Each Provider

### Use Gmail (`gmail`) when:
- Sending to ≤500 recipients/day
- Regular transactional emails
- Testing and development
- Small announcements

### Use Relay (`relay`) when:
- Sending to >500 recipients
- Bulk newsletters
- Marketing campaigns
- High-volume notifications

## Migration Strategy

### If currently using Gmail and need more capacity:

1. **Setup Workspace SMTP Relay** (see Setup Instructions)
2. **Test with small batch:**
   ```typescript
   // Test with 5-10 emails first
   await sendBatchNewsletters({
     // ... your newsletter content
     provider: 'relay'
   })
   ```
3. **Verify deliverability:** Check spam scores, inbox placement
4. **Gradually increase volume**
5. **Update default if desired:**
   ```env
   SMTP_PROVIDER_DEFAULT=relay
   ```

### Gradual rollout:

Week 1: Test relay with 50 emails
Week 2: Send to 200 using relay
Week 3: Send to 500 using relay
Week 4+: Full rollout with relay

## Security Notes

- ✅ Passwords have whitespace auto-removed
- ✅ No secrets logged (only error codes/messages)
- ✅ TLS encryption required for relay
- ✅ SSL encryption for Gmail
- ✅ App passwords (not account passwords)

## Support

### Verify your setup works:

```bash
# 1. Check env vars are set
echo $GMAIL_USER
echo $RELAY_USER

# 2. Verify transports
curl http://localhost:3000/api/email-marketing/verify-transports

# 3. Send test with gmail
curl -X POST http://localhost:3000/api/email-marketing/test \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","from_name":"Test","from_email":"info@disciplinerift.com","html":"<p>Test</p>","text_alt":"Test","test_emails":["your@email.com"]}'

# 4. Send test with relay
curl -X POST http://localhost:3000/api/email-marketing/test \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","from_name":"Test","from_email":"info@disciplinerift.com","html":"<p>Test</p>","text_alt":"Test","test_emails":["your@email.com"],"provider":"relay"}'
```

If all 4 steps pass, you're good to go! 🎉

