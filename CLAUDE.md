# Home Network Dashboard

Brutalist-designed home network dashboard with Google OAuth, role-based access control, and admin interface for managing services.

## Tech Stack

**Backend** (Express/Node.js)
- SQLite database via better-sqlite3
- Passport.js + Google OAuth 2.0
- Session management with connect-sqlite3
- Models: User, Service, Section

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
│   │   └── Section.js        # Section CRUD with services
│   ├── routes/
│   │   ├── auth.js           # /auth/* - OAuth endpoints
│   │   ├── services.js       # /api/services - CRUD with config
│   │   ├── sections.js       # /api/sections - CRUD
│   │   ├── users.js          # /api/users - admin only
│   │   └── calendar.js       # /api/calendar - Calendar API proxy
│   ├── services/
│   │   └── calendarService.js # Google Calendar API integration
│   └── server.js             # Express app entry
├── client/
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx      # Main view with service cards
│       │   ├── ServiceCard.jsx    # Individual service card (routes by type)
│       │   ├── CalendarCard.jsx   # Calendar card with day/week/month views
│       │   ├── AdminPanel.jsx     # Admin interface tabs
│       │   ├── ServiceForm.jsx    # Create/edit services with calendar config
│       │   ├── SectionManager.jsx # Manage sections
│       │   └── UserManagement.jsx # Manage users
│       ├── context/
│       │   └── AuthContext.jsx    # Auth state & user data
│       ├── hooks/
│       │   └── useServices.js     # Fetch services hook
│       └── utils/
│           └── api.js             # Axios instance with calendar API
├── data/                   # SQLite databases (runtime)
├── scripts/
│   └── seed.js            # Add initial admin user
└── .env                   # Environment configuration
```

## Database Schema

**users**
- id, google_id (unique), email, name, role (admin/read-only), google_access_token, google_refresh_token
- OAuth tokens stored for Calendar API access

**services**
- id, name, url, icon, display_order, section_id, card_type
- Cards displayed on dashboard linking to internal services
- card_type: Supports 'link' (default) and 'calendar', extensible for future types

**service_config**
- id, service_id, calendar_id, view_type
- Stores card-specific configuration (e.g., calendar settings)
- calendar_id: Google Calendar ID to display
- view_type: Default view ('day', 'week', or 'month')

**sections**
- id, name, display_order, is_default
- Organizational grouping for services

## Key Features

1. **Authentication**: Google OAuth with whitelist-based access
2. **Authorization**: Admin role can manage users/services, read-only can view
3. **Service Cards**: Click-to-open links with icons, organized by sections
4. **Admin Interface**: Manage services, sections, and user access
5. **Brutalist Design**: High-contrast, bold UI with bright accents

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

## Development

**Start backend**: `npm run dev` (nodemon, port 3030)
**Start frontend**: `cd client && npm run dev` (Vite, port 5173)
**Seed admin**: `npm run seed`

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

Working features:
- Google OAuth login with session management and Calendar API integration
- Service cards with icons and links
- Card type system (link and calendar types)
- Section-based organization
- Admin panel for services, sections, and users
- Role-based access control
- Google Calendar integration with day/week/month views
- Responsive brutalist design

## Card Types

The service card system supports different card types via the `card_type` field:

**Currently Supported:**
- `link` (default) - Opens URL in new tab when clicked
- `calendar` - Displays Google Calendar events with day, week, or month views

**Calendar Card Features:**
- Integrates with Google Calendar API using OAuth tokens
- Three view modes: Day, Week (Sunday-Saturday), Month (traditional grid)
- Navigation controls to move forward/backward through time periods
- Event display with time, title, location
- Configurable calendar selection (primary or other calendars)
- Configurable default view type per card

**Extensible Design:**
The card_type field is designed to support future types like:
- `embed` - Embedded iframe content
- `iframe` - Full-page iframe view
- `widget` - Interactive dashboard widget
- `status` - Service status indicator

**To Add New Card Type:**
1. Update CHECK constraint in `server/models/init-db.js`:
   ```sql
   CHECK(card_type IN ('link', 'calendar', 'embed', 'iframe', 'widget'))
   ```
2. Add migration to handle existing databases
3. Update validation in `server/routes/services.js`:
   ```js
   body('card_type').optional().isIn(['link', 'calendar', 'embed', 'iframe', 'widget'])
   ```
4. Add option to dropdown in `client/src/components/ServiceForm.jsx`
5. Implement rendering logic in `client/src/components/ServiceCard.jsx`
6. Create dedicated component (like `CalendarCard.jsx`) if needed

## Common Tasks

**Add new service field**:
1. Update schema in `server/models/init-db.js`
2. Update Service model methods in `server/models/Service.js`
3. Update API routes in `server/routes/services.js`
4. Update ServiceForm component in `client/src/components/ServiceForm.jsx`
5. Update ServiceCard display if needed

**Add new admin feature**:
1. Create/update model in `server/models/`
2. Create route in `server/routes/` with auth middleware
3. Add tab to AdminPanel component
4. Create management component in `client/src/components/`
