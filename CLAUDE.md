# Home Network Dashboard

Brutalist-designed home network dashboard with Google OAuth, role-based access control, and admin interface for managing services.

## Tech Stack

**Backend** (Express/Node.js)

- SQLite database via better-sqlite3
- Passport.js + Google OAuth 2.0
- Session management with connect-sqlite3
- Models: User, Service, ServiceConfig, Section, Note

**Frontend** (React + Vite)

- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons

## Architecture

```
home-network-dashboard/
├── server/
│   ├── config/
│   │   ├── database.js       # SQLite connection
│   │   └── passport.js       # Google OAuth config with Calendar scope
│   ├── middleware/
│   │   ├── auth.js           # isAuthenticated check
│   │   └── admin.js          # isAdmin check
│   ├── models/
│   │   ├── init-db.js        # DB schema & initialization
│   │   ├── User.js           # User CRUD operations
│   │   ├── Service.js        # Service CRUD operations
│   │   ├── ServiceConfig.js  # Calendar config operations
│   │   ├── Section.js        # Section CRUD with services
│   │   └── Note.js           # Note CRUD operations
│   ├── routes/
│   │   ├── auth.js           # /auth/* - OAuth endpoints
│   │   ├── services.js       # /api/services - CRUD with config
│   │   ├── sections.js       # /api/sections - CRUD
│   │   ├── users.js          # /api/users - admin only
│   │   ├── calendar.js       # /api/calendar - Calendar API proxy
│   │   └── notes.js          # /api/notes - CRUD for sticky notes
│   ├── services/
│   │   └── calendarService.js # Google Calendar API integration
│   └── server.js             # Express app entry
├── client/
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx          # Main view with collapsible sections
│       │   ├── ServiceCard.jsx        # Routes card rendering by type
│       │   ├── CalendarCard.jsx       # Calendar with responsive views
│       │   ├── Dialog.jsx             # Unified dialog component (blue header)
│       │   ├── EventDetailDialog.jsx  # Event details with attendees/links
│       │   ├── StickyNoteCard.jsx     # Draggable sticky note display
│       │   ├── NoteDialog.jsx         # Note create/edit/delete dialog
│       │   ├── AdminPanel.jsx         # Admin interface tabs
│       │   ├── ServiceForm.jsx        # Service CRUD with calendar config
│       │   ├── SectionManager.jsx     # Section management
│       │   ├── UserManagement.jsx     # User whitelist management
│       │   └── ProtectedRoute.jsx     # Route protection HOC
│       ├── context/
│       │   └── AuthContext.jsx        # Auth provider (exports useAuth)
│       ├── hooks/
│       │   └── useAuth.js             # Re-exports useAuth from context
│       └── utils/
│           ├── api.js                 # Axios with API endpoints
│           ├── dateUtils.js           # Due date formatting & categorization
│           └── noteColors.js          # Sticky note color palette
├── data/                   # SQLite databases (runtime)
├── scripts/
│   └── seed.js            # Add initial admin user
└── .env                   # Environment configuration
```

## Database Schema

**users**: id, google_id (nullable), email, name, role (admin/readonly), google_access_token, google_refresh_token

**services**: id, name, url, icon, display_order, section_id, card_type (link/calendar)

**service_config**: id, service_id, calendar_id, view_type (day/week/month)

**sections**: id, name, display_order, is_default

**notes**: id, title, message, color, due_date (nullable), author_id, author_name, section_id, display_order, created_at, updated_at

## Key Features

1. **Authentication**: Google OAuth with whitelist-based access
2. **Authorization**: Admin role can manage users/services, readonly can view
3. **Service Cards**: Link and calendar card types, organized in collapsible sections
4. **Calendar Integration**: Day/week/month views with event details, attendees, meeting links
5. **Sticky Notes**: Draggable notes with due dates, color coding, and urgency badges
6. **Admin Interface**: Manage services, sections, and user access
7. **Responsive Design**: Brutalist styling with adaptive layouts

## API Endpoints

**Auth**

- GET `/auth/google` - Initiate OAuth
- GET `/auth/google/callback` - OAuth callback
- GET `/auth/user` - Current user info
- POST `/auth/logout` - End session

**Services** (authenticated)

- GET `/api/services` - List all services with config
- POST `/api/services` - Create with optional calendar config (admin only)
- PUT `/api/services/:id` - Update with optional calendar config (admin only)
- DELETE `/api/services/:id` - Delete (admin only)
- PUT `/api/services/reorder` - Update display order (admin only)

**Sections** (authenticated)

- GET `/api/sections` - List all sections
- GET `/api/sections/with-services` - Sections with nested services
- POST `/api/sections` - Create (admin only)
- PUT `/api/sections/:id` - Update (admin only)
- DELETE `/api/sections/:id` - Delete (admin only)
- PUT `/api/sections/reorder` - Update display order (admin only)

**Users** (admin only)

- GET `/api/users` - List all users
- POST `/api/users` - Add user to whitelist
- DELETE `/api/users/:id` - Remove user

**Calendar** (authenticated)

- GET `/api/calendar/calendars` - List user's Google calendars
- GET `/api/calendar/events` - Get events for a calendar (params: calendarId, timeMin, timeMax)

**Notes** (authenticated)

- GET `/api/notes` - List all notes
- GET `/api/notes/section/:sectionId` - Get notes for a specific section
- POST `/api/notes` - Create note (requires: title, message, color, sectionId; optional: dueDate)
- PUT `/api/notes/:id` - Update note (author can edit own notes)
- DELETE `/api/notes/:id` - Delete note (author or admin only)
- PUT `/api/notes/reorder` - Update display order via drag-and-drop

## Development

**Start backend**: `npm run dev` (nodemon, port 3030)
**Start frontend**: `cd client && npm run dev` (Vite, port 5173)
**Seed admin**: `npm run seed`

**Code Quality**:
- `npm run lint` - Run ESLint on entire codebase
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes
- `cd client && npm run lint` - Lint frontend code only

**ESLint Configuration**: Flat config (v9.x) with React, React Hooks, JSON, and Markdown plugins. All code follows best practices with zero lint errors.

## Environment Variables

Required in `.env`:

- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_CALLBACK_URL` - OAuth redirect URI
- `SESSION_SECRET` - Session encryption key
- `DATABASE_PATH` - SQLite database path
- `NODE_ENV` - production/development
- `PORT` - Server port (default 3030)

## Current State

Fully functional with Google OAuth, role-based access, link/calendar card types, sticky notes with drag-and-drop reordering, collapsible sections, admin panel, and responsive brutalist design. Calendar integration includes day/week/month views with event details. Sticky notes support due dates with urgency indicators and customizable colors. All dialogs use a unified Dialog component with consistent blue header design and mobile-responsive layouts.

**Code Quality**: Full ESLint and Prettier setup with zero lint errors. Code follows React best practices including proper hooks usage (useCallback, useMemo), no unused variables, and optimized component rendering.

## Card Types

The service card system supports different card types via the `card_type` field:

**Currently Supported:**

- `link` (default) - Opens URL in new tab when clicked
- `calendar` - Displays Google Calendar events with day, week, or month views

**Calendar Card Features:**

- Three view modes: Day, Week (Sunday-Saturday), Month (traditional grid)
- Event detail dialog with attendees, response status, organizer, meeting/hangout links
- Responsive layouts: Month view disabled <900px, week view stacks <672px (ResizeObserver)
- Event deduplication, all-day event support
- Navigation controls (prev/next/today) with view persistence
- Configurable calendar selection and default view type

**Adding New Card Types:**

1. Update CHECK constraint in `server/models/init-db.js` and add migration
2. Update validation in `server/routes/services.js`
3. Add option to ServiceForm dropdown, implement rendering in ServiceCard
4. Create dedicated component if needed (e.g., CalendarCard)

## Sticky Notes

Sticky notes are section-specific notes that appear alongside services within collapsible sections.

**Features:**

- Drag-and-drop reordering within sections
- Customizable colors (10 color palette: yellows, pinks, blues, greens)
- Optional due dates with intelligent categorization
- Urgency badges: "DUE TODAY" (red), "DUE SOON" (orange), "OVERDUE" (red alert)
- Future dates displayed without badge
- Author attribution (automatic from authenticated user)
- Folded corner design element (bottom-right)
- Click to edit/view details
- Author or admin can delete notes
- Character limits: title (200 chars), message (5000 chars)

**Due Date Categories:**

- `overdue` - Past due (red badge with AlertTriangle icon)
- `today` - Due today (red badge with AlertCircle icon)
- `soon` - Due within 3 days (orange badge with Clock icon)
- `future` - Due later (no badge, shows date with Calendar icon)
- `none` - No due date set

**Display Rules:**

- Notes shown in masonry grid layout
- Aspect ratio: square (1:1)
- Size range: min 200px, max 280px
- Ring highlight on drag-over (blue)
- Responsive grid with auto-fit columns

## Unified Dialog Component

All dialogs in the application use a shared Dialog component for consistency and maintainability.

**Features:**

- Blue header (bg-accent1) with white text and close button
- Scrollable content section with customizable spacing
- Optional footer section for action buttons
- Responsive design with Tailwind breakpoints
- Click-outside-to-close functionality
- Configurable max width and z-index

**Props:**

- `title` (string) - Dialog title displayed in header
- `onClose` (function) - Handler called when dialog is closed
- `children` (ReactNode) - Content section of dialog
- `footer` (ReactNode, optional) - Footer with action buttons
- `maxWidth` (string, optional) - Max width class (default: 'max-w-2xl')
- `contentClassName` (string, optional) - Additional classes for content
- `zIndex` (number, optional) - Z-index for dialog (default: 50)

**Usage Example:**

```jsx
<Dialog
  title="Edit Service"
  onClose={handleClose}
  footer={
    <div className="flex gap-3">
      <button onClick={handleSave} className="btn-brutal-primary">
        Save
      </button>
      <button onClick={handleClose} className="btn-brutal">
        Cancel
      </button>
    </div>
  }
>
  <form className="space-y-4">{/* Form fields */}</form>
</Dialog>
```

**Used By:**

- NoteDialog - Create/edit sticky notes
- EventDetailDialog - Display calendar event details
- ServiceForm - Add/edit services
- SectionManager - Add/edit sections
- UserManagement - Add users to whitelist

## Common Tasks

**Add service field**: Update init-db.js (schema), Service.js (model), services.js (routes), ServiceForm.jsx (UI)

**Add note field**: Update init-db.js (schema), Note.js (model), notes.js (routes), NoteDialog.jsx (UI)

**Add admin feature**: Create model, add route with auth middleware, add AdminPanel tab, create management component

**Add new dialog**: Use Dialog component with title, onClose, optional footer, and content as children
