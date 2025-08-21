# Dashboard Calendar - Practice Management System

## Implemented Features

### 🗓️ Weekly Calendar View
- **Location**: `/calendario`
- **Main component**: `CalendarWeek.tsx`
- **Technology**: FullCalendar with timeGrid, interaction and luxon plugins
- **Time zone**: America/New_York
- **Features**:
  - Weekly view (timeGridWeek) and daily view (timeGridDay) on mobile
  - Filters by team and coach
  - Events with unique colors per team
  - Responsive design
  - Keyboard navigation

### 📝 Event Management
- **Component**: `EventDrawer.tsx`
- **Features**:
  - View team details, coach, schedule
  - Edit complete practice series (days, times, dates, coach)
  - List of upcoming occurrences
  - Form validations

### 📧 Parent Communication
- **Email sending**: API endpoint `/api/calendar/send-email`
- **Features**:
  - Automatically gets parent emails from team
  - Responsive HTML template for emails
  - Recipient deduplication
  - Error handling and sending reports
  - Support for plain text and HTML

### 🔧 Technical Architecture

#### File Structure
```
utils/
  schedule.ts              # Utilities for parsing days and expanding occurrences

lib/calendar/
  supabase-client.ts       # Client for calendar operations in Supabase

components/calendar/
  CalendarWeek.tsx         # Main FullCalendar component
  EventDrawer.tsx          # Side panel for event management

lib/
  mailer.ts               # Email sending service with nodemailer

app/api/calendar/
  send-email/route.ts     # API endpoint for sending emails
```

#### Data Flow
1. **Sessions** → `expandOccurrences()` → **Calendar events**
2. **Event click** → `EventDrawer` → **Edit/Email/SMS**
3. **Save** → `updateSession()` → **Automatic calendar reload**

## Required Environment Variables

```env
# SMTP configuration for emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME="Practice System"

# Application URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional SMS configuration (future)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Database Structure

### Tables Used
- **session**: Practice series configuration
- **team**: Team information
- **enrollment**: Student-team relationship (isactive=true)
- **student**: Student information
- **parent**: Parent contact information
- **staff**: Coach/staff information

### Important Fields
```sql
session(
  sessionid uuid,
  teamid uuid,
  startdate date,
  enddate date,
  starttime time,
  endtime time,
  daysofweek varchar,  -- "monday,wednesday,friday" or "lunes,miércoles,viernes"
  repeat varchar,
  coachid uuid
)
```

## Usage and Navigation

### For Users
1. **Access calendar**: Click on "Schedule" → "View calendar" or navigate to `/calendario`
2. **View practice**: Click on any calendar event
3. **Edit practice**: In side panel → "Edit" tab → Modify fields → "Save changes"
4. **Send reminders**: In side panel → "Send Email" or "Send SMS"

### Available Filters
- **By team**: "All teams" dropdown
- **By coach**: "All coaches" dropdown
- **Mobile view**: Toggle between weekly and daily view

## Utility Functions

### `utils/schedule.ts`
- `parseDaysOfWeek(str)`: Converts day string to ISO numbers
- `expandOccurrences(session)`: Generates all dates for a series
- `formatDaysOfWeek(str)`: Formats days for display
- `validateDaysOfWeek(str)`: Validates day format

### Day of Week Examples
```javascript
// Valid formats:
"monday,wednesday,friday"
"lunes,miércoles,viernes"  
"mon,wed,fri"
"1,3,5"  // ISO: 1=Monday, 7=Sunday
```

## Manual Testing

### Test Cases
1. **Create test session**:
   ```sql
   INSERT INTO session (teamid, startdate, enddate, starttime, endtime, daysofweek, repeat)
   VALUES ('team-id', '2024-01-15', '2024-01-29', '15:00', '16:30', 'monday,wednesday', 'weekly');
   ```

2. **Verify events**: Should show 6 events (3 Mondays + 3 Wednesdays)

3. **Edit series**: Change time and verify everything updates

4. **Send email**: Verify it reaches team parents

### Breakpoints to Test
- **Mobile**: 360px - Automatic day view
- **Tablet**: 768px - Stacked filters
- **Desktop**: 1024px+ - Full view

## Troubleshooting

### Common Errors
1. **"Email not configured"**: Check SMTP_* variables
2. **"No recipients found"**: Check enrollment.isactive=true and parent.email
3. **Events not showing**: Check daysofweek format and dates

### Useful Logs
- Browser console for client errors
- Server logs for API errors
- Check network tab for Supabase calls

## Upcoming Improvements
- [ ] Complete SMS integration with Twilio
- [ ] Push notifications
- [ ] Export calendar to ICS
- [ ] Drag & drop to move events
- [ ] Monthly view
- [ ] Automatic reminders

---
**Implementation date**: January 2024  
**Stack**: Next.js, FullCalendar, Luxon, Supabase, Nodemailer
