# Email Marketing System - Recent Updates

## Latest Changes (Dual SMTP + Improvements)

### 1. ✅ Dual SMTP Provider Support

Now supports two SMTP providers:
- **Gmail SMTP** (`gmail`) - For regular campaigns ≤500 emails/day
- **Google Workspace SMTP Relay** (`relay`) - For bulk sending without limits

**How it works:**
- Default provider: `gmail` (backward compatible)
- Select provider in UI dropdown or via API parameter
- All existing code works without changes

### 2. ✅ Removed 500 Email Limit Warning

**Before:** System blocked sends with >500 subscribers
**Now:** No limit - use Workspace Relay for unlimited sending

The Gmail limit warning has been removed from:
- `/email-marketing` dashboard
- `/api/email-marketing/send` endpoint

### 3. ✅ Duplicate Email Prevention

**Automatic deduplication:**
- Filters Newsletter table for unique emails (case-insensitive)
- If `user@example.com` and `USER@EXAMPLE.COM` both exist, only one email is sent
- Prevents wasting quota and annoying subscribers

**Implementation:**
```typescript
const uniqueEmails = Array.from(
  new Map(validEmails.map(item => [item.email.toLowerCase(), item])).values()
)
```

### 4. ✅ Automatic Unsubscribe Link Injection

**Every email now includes unsubscribe:**
- Checks if HTML contains "unsubscribe" text
- If missing, automatically adds unsubscribe footer
- Prevents spam classification

**Footer added when missing:**
```html
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
  <p>Don't want to receive these emails? <a href="[unsubscribe_url]">Unsubscribe</a></p>
</div>
```

**Still includes headers:**
- `List-Unsubscribe` header
- `List-Unsubscribe-Post` header (one-click unsubscribe)
- `List-ID` header

### 5. ✅ UNSUBSCRIBE_URL_BASE Variable

**New environment variable:**
```env
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com
```

**Priority order:**
1. `UNSUBSCRIBE_URL_BASE` (if set)
2. `NEXT_PUBLIC_APP_URL` (fallback)
3. `http://localhost:3000` (dev fallback)

**Why this matters:**
- Production unsubscribe links use correct domain
- No broken links in production emails
- Independent from app URL

## Updated Environment Variables

Add to `.env.local`:

```env
# ==========================================
# Gmail SMTP (for ≤500 emails/day)
# ==========================================
GMAIL_HOST=smtp.gmail.com
GMAIL_PORT=465
GMAIL_USER=info@disciplinerift.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# ==========================================
# Workspace SMTP Relay (for unlimited bulk)
# ==========================================
RELAY_HOST=smtp-relay.gmail.com
RELAY_PORT=587
RELAY_REQUIRE_TLS=true
RELAY_USER=info@disciplinerift.com
RELAY_PASS=your-workspace-app-password

# ==========================================
# Unsubscribe Configuration
# ==========================================
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com
UNSUBSCRIBE_SECRET=your-secret-key

# ==========================================
# Batch Sending (optional)
# ==========================================
SMTP_PROVIDER_DEFAULT=gmail
BATCH_SIZE=50
CONCURRENCY=3
DELAY_BETWEEN_BATCH_MS=5000
```

## Migration from Previous Version

### If you were using Gmail only:

**No action required!** Everything continues to work as before.

**To use Workspace Relay:**
1. Set up SMTP Relay in Google Workspace Admin
2. Add `RELAY_*` environment variables
3. Select "Workspace Relay" in compose UI
4. Send without limits

### If you had the 500 limit warning:

**Automatically removed!** No more blocking on >500 subscribers.

**Recommendation:** Use Workspace Relay for campaigns >500 emails.

## Anti-Spam Features

### ✅ Every email includes:

1. **List-Unsubscribe header** (email clients show "Unsubscribe" button)
2. **List-Unsubscribe-Post header** (one-click unsubscribe RFC 8058)
3. **List-ID header** (identifies newsletter list)
4. **Unsubscribe link in body** (visible link for users)
5. **Plain text alternative** (better deliverability)

### ✅ Duplicate prevention:

- Only one email per address (case-insensitive)
- Reduces spam complaints
- Improves sender reputation

### ✅ One-click unsubscribe:

- User clicks unsubscribe → record deleted from Newsletter
- No complicated process
- Reduces spam reports

## Testing the Updates

### 1. Test Duplicate Prevention

```sql
-- Add duplicate emails to Newsletter (different case)
INSERT INTO "Newsletter" (email) VALUES 
  ('test@example.com'),
  ('TEST@example.com'),
  ('Test@Example.Com');

-- Send newsletter
-- Result: Only ONE email sent to test@example.com
```

### 2. Test Automatic Unsubscribe Link

**Scenario A: HTML has "unsubscribe"**
```html
<h1>Newsletter</h1>
<p>Content here...</p>
<p><a href="#">Unsubscribe here</a></p>
```
→ **Sent as-is** (no footer added)

**Scenario B: HTML missing "unsubscribe"**
```html
<h1>Newsletter</h1>
<p>Content here...</p>
```
→ **Footer auto-added** with unsubscribe link

### 3. Test UNSUBSCRIBE_URL_BASE

```env
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com
```

Send test email and check unsubscribe link:
```html
<!-- Should be: -->
<a href="https://disciplinerift.com/api/email-marketing/unsubscribe?token=...">Unsubscribe</a>
```

### 4. Test Relay Provider

**UI Test:**
1. Go to `/email-marketing/compose`
2. Select "Workspace Relay (bulk sending)"
3. Send to 600+ subscribers
4. Should complete without errors

**API Test:**
```bash
curl -X POST http://localhost:3000/api/email-marketing/send \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Bulk Newsletter",
    "from_name": "DisciplineRift",
    "from_email": "info@disciplinerift.com",
    "html": "<h1>Newsletter</h1><p>Content</p>",
    "text_alt": "Newsletter content",
    "provider": "relay"
  }'
```

## Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Max subscribers | 500 (blocked) | Unlimited (with relay) |
| Duplicate emails | Sent to all | Deduplicated automatically |
| Unsubscribe link | Manual (could be missing) | Auto-added if missing |
| Provider choice | Gmail only | Gmail or Workspace Relay |
| URL configuration | NEXT_PUBLIC_APP_URL only | UNSUBSCRIBE_URL_BASE priority |
| Warning on >500 | Yes (blocking) | No (use relay) |

## Best Practices

### For campaigns ≤500 subscribers:
✅ Use **Gmail SMTP** (default)
- Free
- Simple
- Reliable

### For campaigns >500 subscribers:
✅ Use **Workspace Relay**
- No daily limits
- Built for bulk
- Better for growth

### Always:
✅ Include unsubscribe (auto-added if missing)
✅ Use plain text alternative
✅ Set UNSUBSCRIBE_URL_BASE in production
✅ Monitor bounce rates
✅ Clean invalid emails

## Troubleshooting

### Issue: Duplicate emails still being sent

**Check:**
```typescript
// In send/route.ts
const uniqueEmails = Array.from(
  new Map(validEmails.map(item => [item.email.toLowerCase(), item])).values()
)
console.log('Unique emails:', uniqueEmails.length) // Should be less than total if duplicates exist
```

### Issue: Unsubscribe link not in email

**Cause:** HTML contains word "unsubscribe" somewhere else

**Solution:** Detection is case-insensitive. Check if your HTML includes:
- "unsubscribe"
- "Unsubscribe"
- "UNSUBSCRIBE"

If yes, footer won't be added (assumes you have your own).

### Issue: Unsubscribe link wrong domain

**Check environment variable:**
```env
UNSUBSCRIBE_URL_BASE=https://disciplinerift.com  # Must include https://
```

**Verify in sent email:**
View email source, search for "List-Unsubscribe" header.

### Issue: Still seeing 500 limit error

**Cause:** Old cache or not restarted server

**Solution:**
```bash
# Kill and restart dev server
npm run dev
```

## Summary

✅ **Removed** 500 email limit warning
✅ **Added** Workspace SMTP Relay support
✅ **Improved** duplicate email prevention
✅ **Enhanced** automatic unsubscribe link injection
✅ **Added** UNSUBSCRIBE_URL_BASE variable

All changes are **backward compatible**. Existing code works without modifications.

For unlimited sending, use Workspace Relay provider! 🚀


