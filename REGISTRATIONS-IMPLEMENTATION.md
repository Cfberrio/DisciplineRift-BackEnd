# Registrations Module - Implementation Guide

## ✅ Phase 1: Core Team Management (COMPLETED)

### What Was Implemented

#### 1. **Data Fetching with React Query**
- Installed `@tanstack/react-query` for optimized data fetching
- Created `QueryProvider` wrapper in `lib/providers/query-provider.tsx`
- Configured with:
  - 1-minute stale time
  - No refetch on window focus
  - Single retry on failure

#### 2. **Custom Hooks (`hooks/use-teams.ts`)**
- `useTeams(filters, page)` - Fetch teams with filtering and pagination
- `useTeamStats()` - Fetch real-time statistics
- `useCreateTeam()` - Create new team with optimistic updates
- `useUpdateTeam()` - Update existing team
- `useDeleteTeam()` - Delete team (with validation)

**Features:**
- Automatic cache invalidation
- Toast notifications for success/error
- Enrollment count aggregation
- Pagination support (20 teams per page)

#### 3. **API Routes**
- `POST /api/registrations/teams` - Create team
- `PATCH /api/registrations/teams/[teamid]` - Update team
- `DELETE /api/registrations/teams/[teamid]` - Delete team (with enrollment check)

**Security:**
- Server-side validation
- Required fields checking
- Cascade delete for sessions
- Enrollment protection

#### 4. **UI Components**

##### `app/registrations/page.tsx`
- Main page with Suspense boundaries
- Statistics dashboard
- Teams table with filters

##### `components/registrations/teams-stats.tsx`
- Real-time statistics cards:
  - Total Teams
  - Active Teams
  - Ongoing Teams
  - Total Students

##### `components/registrations/teams-table.tsx`
- Sortable, filterable, paginated table
- Filters:
  - Search by team name (debounced)
  - Filter by school
  - Filter by sport
- Actions:
  - Create new team
  - Edit team
  - Delete team (with confirmation)
- Display:
  - Team name, sport, school
  - Status badges (Active/Inactive, Ongoing)
  - Enrollment count vs. capacity
  - Price

##### `components/registrations/team-dialog.tsx`
- Create/Edit team form
- Form fields:
  - Team Name (required)
  - Sport
  - School (dropdown, required)
  - Description (textarea)
  - Max Participants (required)
  - Price
  - Active toggle
  - Ongoing toggle
- Validation with Zod schema
- Loading states

#### 5. **Performance Optimizations**
- ✅ Debounced search (500ms)
- ✅ React Query caching
- ✅ Pagination (20 items per page)
- ✅ useMemo for derived data
- ✅ Suspense boundaries for loading
- ✅ Skeleton loaders
- ✅ No Context API (avoids infinite loops)

#### 6. **Navigation**
- Added "Registrations" to sidebar
- Route: `/registrations`
- Icon: ClipboardList
- Services section remains intact

---

## 🚧 Phase 2: Session Management (TODO)

### What Needs to Be Built

#### 1. **Session Hooks**
Create `hooks/use-sessions.ts`:
- `useSessions(teamId)` - Fetch sessions for a team
- `useCreateSession()` - Create session
- `useUpdateSession()` - Update session
- `useDeleteSession()` - Delete session

#### 2. **API Routes**
- `POST /api/registrations/sessions` - Create session
- `PATCH /api/registrations/sessions/[sessionid]` - Update session
- `DELETE /api/registrations/sessions/[sessionid]` - Delete session

#### 3. **UI Components**
- `components/registrations/sessions-manager.tsx` - Main session management
- `components/registrations/session-dialog.tsx` - Create/edit session form
- `components/registrations/session-card.tsx` - Display session info

#### 4. **Features**
- Days of week selector (multi-select)
- Time picker (start/end)
- Date range picker (start/end)
- Coach assignment (dropdown from staff)
- Display sessions grouped by day
- Quick actions (edit, delete, duplicate)

---

## 🚧 Phase 3: Enrollment Management (TODO)

### What Needs to Be Built

#### 1. **Enrollment Hooks**
Create `hooks/use-enrollments.ts`:
- `useEnrollments(teamId)` - Fetch enrollments for team
- `useAvailableStudents(teamId)` - Fetch students not enrolled
- `useEnrollStudent()` - Enroll student
- `useUnenrollStudent()` - Remove enrollment

#### 2. **API Routes**
- `POST /api/registrations/enrollments` - Enroll student
- `DELETE /api/registrations/enrollments/[enrollmentid]` - Unenroll student
- `GET /api/registrations/enrollments/available/[teamid]` - Get available students

#### 3. **UI Components**
- `components/registrations/enrollment-manager.tsx` - Main enrollment UI
- `components/registrations/student-search.tsx` - Search and add students
- `components/registrations/enrolled-list.tsx` - Current enrollments

#### 4. **Features**
- Search students by name
- Filter by grade, school
- Bulk enroll/unenroll
- Capacity warning
- Student details on hover
- Parent contact info

---

## 🚧 Phase 4: Roster Generation (TODO)

### What Needs to Be Built

#### 1. **Roster Hooks**
Create `hooks/use-roster.ts`:
- `useRoster(teamId)` - Fetch full roster with all related data
- `useGenerateRosterPDF()` - Generate PDF

#### 2. **API Routes**
- `GET /api/registrations/roster/[teamid]` - Get roster data
- `POST /api/registrations/roster/[teamid]/pdf` - Generate PDF

#### 3. **UI Components**
- `components/registrations/roster-view.tsx` - Roster display
- `components/registrations/roster-pdf.tsx` - PDF template

#### 4. **Features**
- Full roster table with:
  - Student info (name, grade, DOB)
  - Parent info (name, email, phone)
  - Emergency contact
  - Enrollment date
- Export to PDF (printable)
- Search and filter
- Sorting options
- Print-friendly format

#### 5. **PDF Generation**
Use `jspdf` and `jspdf-autotable` (already installed):
- Team header with logo
- School and coach info
- Session schedule
- Student table
- Footer with date/time

---

## 📋 Integration Checklist

### Before Moving to Phase 2:
- [x] Test team creation
- [x] Test team editing
- [x] Test team deletion
- [x] Test all filters
- [x] Test pagination
- [x] Verify statistics update
- [ ] Test with real data
- [ ] Performance testing with 100+ teams

### Migration from /servicios:
- Keep /servicios active during development
- Once all phases complete, compare functionality
- Test side-by-side
- Get user approval
- Redirect /servicios → /registrations
- Archive old code

---

## 🎯 Key Performance Metrics

### Target Performance:
- Initial load: < 500ms
- Search/filter: < 100ms (with debounce)
- Page navigation: < 200ms
- API calls: < 300ms

### Monitoring:
- React Query DevTools (in development)
- Console performance logs
- Network tab analysis

---

## 📝 Testing Strategy

### Manual Testing:
1. Create 5-10 teams with different schools/sports
2. Test all filter combinations
3. Test pagination
4. Test edit/delete
5. Test with/without enrollments
6. Test permissions (if implemented)

### Edge Cases:
- Team with 0 enrollments
- Team at capacity
- Deleting team with enrollments (should fail)
- Invalid form data
- Network failures

---

## 🔒 Security Considerations

### Implemented:
- Server-side validation
- Required field checks
- Enrollment protection on delete
- SQL injection prevention (Supabase handles this)

### TODO:
- Role-based access control
- Audit logging
- Rate limiting on API routes

---

## 🚀 Deployment Notes

### Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database:
- No migrations needed (uses existing tables)
- Ensure RLS policies are configured

### Build:
```bash
npm run build
npm run start
```

---

## 📞 Support & Maintenance

### Common Issues:

**Error: "Failed to fetch teams"**
- Check Supabase connection
- Verify table permissions
- Check RLS policies

**Error: "Cannot delete team with enrollments"**
- Expected behavior
- Must remove enrollments first

**Slow performance**
- Check React Query cache
- Verify pagination is working
- Check database indexes

---

## 🎉 Phase 1 Summary

**Files Created:** 11
**Lines of Code:** ~1,500
**Dependencies Added:** 1 (@tanstack/react-query)
**API Routes:** 3
**Components:** 4
**Hooks:** 2

**Ready for Phase 2!** 🚀


