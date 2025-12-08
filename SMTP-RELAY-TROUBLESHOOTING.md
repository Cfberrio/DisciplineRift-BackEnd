# SMTP Relay Troubleshooting Guide

## Quick Diagnosis

Visit: `http://localhost:3000/email-marketing/diagnostics`

This page will:
- Test your SMTP Relay connection step by step
- Show exactly what's working and what's failing
- Provide specific recommendations
- Allow you to send test emails

## Common Errors and Solutions

### Error 421: "Try again later, closing connection"

**Symptom:**
```
Error: Server terminates connection. response=421-4.7.0 Try again later, closing connection. (EHLO)
```

**Cause:** SMTP Relay service is not yet active.

**Solution:**
1. **Wait 30-60 minutes** after enabling SMTP Relay in Google Admin Console
2. The service takes time to propagate across Google's systems
3. This is completely normal and expected
4. Test connection every 10-15 minutes until it works

**Timeline:**
- 0-15 min: Error 421 (normal)
- 15-30 min: Probably still Error 421
- 30-60 min: Should start working
- 60+ min: If still failing, check configuration below

### Error 535: "Authentication failed"

**Symptom:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Cause:** Wrong password or not using App Password.

**Solution:**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate a **new** App Password (16 characters)
3. Select **Mail** as app, **Other** as device
4. Copy the password (spaces are OK, they'll be removed automatically)
5. Update your `.env` file:
   ```env
   RELAY_PASS=abcd efgh ijkl mnop
   ```
6. Restart your Next.js server
7. Test again

**Important:**
- Must use App Password, NOT your regular Google account password
- 2-Step Verification must be enabled on the account
- Use `luis@disciplinerift.com` account credentials

### Connection Timeout

**Symptom:**
```
Error: Connection timeout
Error code: ETIMEDOUT
```

**Cause:** Firewall blocking outbound connection or wrong host/port.

**Solution:**
1. Check your `.env` configuration:
   ```env
   RELAY_HOST=smtp-relay.gmail.com
   RELAY_PORT=587
   ```
2. Verify firewall allows outbound connections to `smtp-relay.gmail.com:587`
3. Test TCP connection: `telnet smtp-relay.gmail.com 587`
4. If on corporate network, check with IT about SMTP restrictions

### "Missing environment variables"

**Symptom:**
Diagnostic test shows missing variables.

**Solution:**
Check your `.env` or `.env.local` file has all required variables:

```env
RELAY_HOST=smtp-relay.gmail.com
RELAY_PORT=587
RELAY_REQUIRE_TLS=true
RELAY_USER=luis@disciplinerift.com
RELAY_PASS=[your-16-character-app-password]
```

After updating, **restart your server**:
```bash
# Press Ctrl+C to stop
npm run dev
```

## Google Admin Console Configuration

### Step 1: Enable SMTP Relay

1. Go to: https://admin.google.com
2. Navigate: **Apps** → **Google Workspace** → **Gmail**
3. Click: **Routing** → **SMTP relay service**
4. Click: **Add Another** or **Configure**

### Step 2: Configure Settings

**Required settings:**
```
Allowed Senders: Only addresses in my domains
Allowed IP addresses: [Leave empty or add your server IPs]
Require SMTP Authentication: ON
Require TLS encryption: ON
```

**Important:**
- ✅ "Only addresses in my domains" must include `disciplinerift.com`
- ✅ "Require SMTP Authentication" must be ON
- ✅ "Require TLS encryption" must be ON
- ✅ IP restrictions can be left empty (will use authentication instead)

### Step 3: Save and Wait

1. Click **Save**
2. **Wait 30-60 minutes** for propagation
3. During this time, you'll get Error 421 - this is normal
4. Test periodically at: `/email-marketing/diagnostics`

## Environment Variables Reference

### Required Variables

```env
# SMTP Relay Configuration
RELAY_HOST=smtp-relay.gmail.com          # Google's SMTP Relay server
RELAY_PORT=587                           # Standard SMTP port with STARTTLS
RELAY_REQUIRE_TLS=true                   # Force TLS encryption
RELAY_USER=luis@disciplinerift.com       # Your Google Workspace email
RELAY_PASS=[16-char-app-password]        # App Password from Google

# Unsubscribe Configuration
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com
UNSUBSCRIBE_SECRET=[random-secret-key]

# Batching Configuration (optional)
BATCH_SIZE=100                           # Emails per batch
CONCURRENCY=5                            # Concurrent sends per batch
DELAY_BETWEEN_BATCH_MS=3000              # Milliseconds between batches
```

### How to Get App Password

1. Visit: https://myaccount.google.com/apppasswords
2. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → "SMTP Relay"
3. Click **Generate**
4. Copy the 16-character password
5. Paste into `.env` file (spaces are OK)

## Testing Workflow

### 1. Test Connection First

```bash
# Visit in browser:
http://localhost:3000/email-marketing/diagnostics

# Click "Test Connection"
# Expected results:
# ✓ Environment Variables Check
# ✓ TCP Connection Test
# ✓ Create Transporter
# ✓ SMTP Verification
```

### 2. Send Test Email

```bash
# After connection test passes:
# 1. Enter your email address
# 2. Click "Send Test Email"
# 3. Check your inbox (and spam folder)
# 4. Confirm email arrives with proper formatting
```

### 3. Monitor Logs

Watch terminal for detailed logs:
```
[PROVIDER][relay] Creating SMTP Relay transporter...
[PROVIDER][relay] Host: smtp-relay.gmail.com
[PROVIDER][relay] Port: 587
[PROVIDER][relay] User: luis@disciplinerift.com
[PROVIDER][relay] Pass: ***SET*** (length: 16)
[PROVIDER][relay] RequireTLS: true
[PROVIDER][relay] ✓ Verification successful
```

## API Endpoints

### Test Connection
```bash
GET http://localhost:3000/api/email-marketing/test-relay-connection

# Returns detailed diagnostic report
```

### Send Test Email
```bash
POST http://localhost:3000/api/email-marketing/send-test-relay
Content-Type: application/json

{
  "to": "your-email@example.com"
}
```

### Validate Configuration
```bash
GET http://localhost:3000/api/email-marketing/validate-config?provider=relay

# Returns environment variables status and SMTP test
```

## Propagation Timeline

| Time | Status | Action |
|------|--------|--------|
| 0 min | Enabled in Admin Console | Save settings |
| 0-15 min | Error 421 | Normal, wait |
| 15-30 min | Probably Error 421 | Keep waiting |
| 30-45 min | May start working | Test connection |
| 45-60 min | Should work | Test connection |
| 60+ min | Still Error 421? | Check configuration |

## Checklist Before Sending 1500+ Emails

- [ ] SMTP Relay enabled in Google Admin Console (30-60 min ago)
- [ ] Environment variables configured correctly
- [ ] App Password generated and set in `RELAY_PASS`
- [ ] Connection test passes at `/email-marketing/diagnostics`
- [ ] Test email sent and received successfully
- [ ] Test email NOT in spam folder
- [ ] HTML template has physical address (CAN-SPAM requirement)
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] Provider set to 'relay' in compose page

## Need More Help?

### Check Logs
All operations log with prefixes:
- `[PROVIDER][relay]` - Transporter creation and configuration
- `[RELAY-TEST]` - Diagnostic tests
- `[RELAY-TEST-SEND]` - Test email sending
- `[NEWSLETTER]` - Actual newsletter sending

### Terminal Commands
```bash
# Restart server (after .env changes)
npm run dev

# Check if port 587 is accessible
telnet smtp-relay.gmail.com 587

# Test environment variables loaded
# (add console.log in code to verify)
```

### Common Mistakes

1. ❌ Using regular password instead of App Password
2. ❌ Not waiting 30-60 minutes after enabling SMTP Relay
3. ❌ Forgetting to restart server after changing `.env`
4. ❌ Wrong email address in `RELAY_USER` (must be @disciplinerift.com)
5. ❌ Typo in `RELAY_HOST` (should be smtp-relay.gmail.com)
6. ❌ Wrong port (should be 587, not 465)

## Success Indicators

When everything is working correctly:

```
[PROVIDER][relay] ✓ Verification successful
[RELAY-TEST] SMTP verification OK - Relay is READY!
[RELAY-TEST-SEND] Email sent successfully in 2.34s
[NEWSLETTER] Progress: 100/1500 sent
[NEWSLETTER] Batch send completed: 1500 sent, 0 failed
```

## Still Having Issues?

1. **Re-check Google Admin Console** settings match exactly
2. **Regenerate App Password** (old one may be invalid)
3. **Wait longer** (propagation can take up to 2 hours in rare cases)
4. **Check Google Workspace status**: https://www.google.com/appsstatus
5. **Contact Google Support** if problem persists after 2 hours

## Ready to Send?

Once all tests pass:
1. Visit: `/email-marketing/compose`
2. Provider should default to "Workspace Relay (bulk sending)"
3. Paste your HTML template (with physical address)
4. Send test to yourself first
5. When confirmed working, send to all 1500+ subscribers

**The system will automatically:**
- Handle batching (100 emails per batch)
- Manage concurrency (5 simultaneous sends)
- Retry on temporary failures
- Log progress every 100 emails
- Report final statistics

Good luck with your campaign! 🚀











