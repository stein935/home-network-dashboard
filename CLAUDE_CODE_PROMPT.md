# Claude Code Prompt - Home Network Dashboard

## Project Overview
Build a responsive web application that serves as a home network dashboard with Google OAuth authentication, role-based access control, and admin interface for managing services. The design should follow brutalist aesthetic principles with bright, bold colors.

## Core Requirements Summary

### Authentication & Authorization
- Implement Google OAuth 2.0 authentication using Passport.js
- Store whitelisted users in SQLite database
- Two user roles: `admin` (can manage services and users) and `readonly` (can only view)
- Session-based authentication with secure cookies
- Redirect unauthorized users to login

### Service Management
- Store services in SQLite database (name, URL, icon, display_order)
- Services display as cards/tiles in responsive grid
- Clicking a service opens URL in new tab
- Admin interface for CRUD operations on services
- Initial services: Router Admin, Pi-hole Admin, Network Monitor

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite3 with better-sqlite3
- **Icons**: Lucide React
- **Authentication**: Passport.js with Google OAuth strategy
- **Deployment**: Docker container on port 3030

### Design Requirements
- **Style**: Brutalist design with bright colors
- **Colors**: Use the palette defined in tailwind.config.js
  - Dark mode: bright green, magenta, cyan, yellow accents
  - Light mode: red, blue, magenta, green accents
- **Typography**: Bold display fonts (Impact/Arial Black) for headers, Arial for body
- **Layout**: Responsive grid - 3 columns desktop, 2 tablet, 1 mobile
- **Theme**: Automatic dark/light mode based on system preference
- **Cards**: Bold 5px borders, brutal box shadows, hover effects
- **Animations**: Subtle transitions on hover and interactions

## File Structure to Create

```
home-network-dashboard/
├── Dockerfile (provided)
├── docker-compose.yml (provided)
├── .env.example (provided)
├── .gitignore
├── README.md
├── package.json (provided)
├── server/
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── admin.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── services.js
│   │   └── users.js
│   └── models/
│       ├── init-db.js
│       ├── User.js
│       └── Service.js
├── client/
│   ├── index.html
│   ├── package.json (see client-package.json)
│   ├── vite.config.js
│   ├── tailwind.config.js (provided)
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Dashboard.jsx (sample provided)
│       │   ├── ServiceCard.jsx (sample provided)
│       │   ├── AdminPanel.jsx
│       │   ├── ServiceForm.jsx
│       │   ├── UserManagement.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   └── useAuth.js
│       ├── utils/
│       │   └── api.js
│       └── styles/
│           └── index.css
└── scripts/
    └── seed.js
```

## Detailed Implementation Instructions

### 1. Database Setup (server/models/init-db.js)
Use the schema.sql file provided as reference. Implement:
- Create users and services tables
- Create indexes for performance
- Auto-initialize database on first run
- Optionally seed with default services

### 2. Backend Server (server/server.js)
Implement:
- Express server setup with middleware (helmet, cors, session)
- Serve static frontend files from client/dist
- Session configuration with SQLite store
- Passport.js initialization
- Route mounting for auth, services, users APIs
- Error handling middleware
- Logging for auth events and errors
- Listen on PORT from environment variable (default 3030)

### 3. Passport Configuration (server/config/passport.js)
Implement:
- Google OAuth Strategy with CLIENT_ID, CLIENT_SECRET, CALLBACK_URL
- Verify callback that checks if user exists in whitelist
- Deny access if user not whitelisted
- Update last_login timestamp on successful login
- Serialize/deserialize user for sessions

### 4. Authentication Middleware (server/middleware/auth.js)
Implement:
- `isAuthenticated`: Check if user is logged in
- `isAuthorized`: Check if user is whitelisted
- Return 401 for unauthenticated, 403 for unauthorized

### 5. Admin Middleware (server/middleware/admin.js)
Implement:
- `isAdmin`: Check if user.role === 'admin'
- Return 403 if not admin

### 6. Auth Routes (server/routes/auth.js)
Implement:
- `GET /auth/google`: Initiate OAuth flow
- `GET /auth/google/callback`: Handle OAuth callback
- `GET /auth/logout`: Destroy session and logout
- `GET /auth/user`: Return current authenticated user info

### 7. Services Routes (server/routes/services.js)
Implement (all routes require authentication):
- `GET /api/services`: List all services ordered by display_order
- `POST /api/services`: Create service (admin only) with validation
- `PUT /api/services/:id`: Update service (admin only) with validation
- `DELETE /api/services/:id`: Delete service (admin only)
- `PUT /api/services/reorder`: Update display_order for multiple services (admin only)

Input validation:
- name: required, string, max 100 chars
- url: required, valid URL format
- icon: required, string (lucide icon name)
- display_order: required, integer

### 8. Users Routes (server/routes/users.js)
Implement (all routes require admin):
- `GET /api/users`: List all whitelisted users
- `POST /api/users`: Add user to whitelist with role
- `PUT /api/users/:id`: Update user role
- `DELETE /api/users/:id`: Remove user from whitelist

Input validation:
- email: required, valid email format
- google_id: required for POST
- name: optional, string
- role: required, must be 'admin' or 'readonly'

### 9. Frontend - Main App (client/src/App.jsx)
Implement:
- React Router setup with routes:
  - `/` - Dashboard (protected)
  - `/admin` - Admin Panel (admin only)
- AuthContext provider wrapper
- Route protection logic
- Loading states while checking auth
- Redirect to Google OAuth if not authenticated

### 10. Frontend - Auth Context (client/src/context/AuthContext.jsx)
Implement:
- Context for user state and auth status
- `fetchUser()` function to get current user from `/auth/user`
- `logout()` function to call `/auth/logout`
- Provide user, loading, error states to children
- Auto-fetch user on mount

### 11. Frontend - Dashboard Component
Use the provided Dashboard.jsx as a starting point. Ensure:
- Fetches services from `/api/services` on mount
- Displays services in responsive grid
- Shows admin settings icon only for admin users
- Handles loading and error states
- Welcome message with user name

### 12. Frontend - ServiceCard Component
Use the provided ServiceCard.jsx as a starting point. Ensure:
- Dynamically loads icon from lucide-react based on icon name
- Opens service URL in new tab on click
- Brutalist styling with hover effects
- Fallback icon if specified icon not found

### 13. Frontend - Admin Panel (client/src/components/AdminPanel.jsx)
Implement:
- Tabbed interface or sections for:
  - Services Management
  - User Management
- Back button to return to dashboard
- Protected by admin role check

### 14. Frontend - Service Form (client/src/components/ServiceForm.jsx)
Implement:
- Form for creating/editing services
- Fields: name, url, icon (dropdown of popular lucide icons)
- Validation feedback
- Submit to POST or PUT /api/services
- Cancel button
- Brutalist form styling

### 15. Frontend - User Management (client/src/components/UserManagement.jsx)
Implement:
- List of all whitelisted users with roles
- Form to add new user (email, google_id, role)
- Ability to change user role
- Ability to remove user (with confirmation)
- Calls to /api/users endpoints
- Brutalist table/list styling

### 16. Frontend - Styling (client/src/styles/index.css)
Implement base Tailwind imports and custom brutalist utilities:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-body bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text;
  }
}

@layer components {
  .btn-brutal {
    @apply border-3 border-light-border dark:border-dark-border 
           bg-light-surface dark:bg-dark-surface
           px-6 py-3 font-display uppercase
           shadow-brutal hover:shadow-none
           hover:translate-x-1 hover:translate-y-1
           active:translate-x-2 active:translate-y-2
           transition-all duration-200;
  }
  
  .input-brutal {
    @apply border-3 border-light-border dark:border-dark-border
           bg-light-surface dark:bg-dark-surface
           text-light-text dark:text-dark-text
           px-4 py-2 font-body
           focus:outline-none focus:border-light-accent1 dark:focus:border-dark-accent1;
  }
}
```

### 17. Vite Configuration (client/vite.config.js)
Configure:
- React plugin
- Proxy API requests to backend during development
- Build output to `dist` directory
- Server port 5173 for dev

### 18. PostCSS Configuration (client/postcss.config.js)
Configure:
- Tailwind CSS
- Autoprefixer

### 19. Seed Script (scripts/seed.js)
Implement:
- Script to add initial admin user to database
- Prompt for Google ID and email
- Optionally seed default services
- Usage: `node scripts/seed.js`

### 20. README.md
Create comprehensive documentation including:
- Project description
- Prerequisites (Docker, Docker Compose, Google Cloud account)
- Google OAuth setup instructions (step-by-step)
- Installation instructions
- Environment variable configuration
- How to add first admin user
- How to run with docker-compose
- How to access the application
- Troubleshooting tips

### 21. .gitignore
Include:
- node_modules/
- .env
- dist/
- data/
- *.db
- *.log
- .DS_Store

## Key Implementation Details

### Google OAuth Setup
1. User clicks login (redirects to /auth/google)
2. Passport initiates OAuth flow with Google
3. User authenticates with Google
4. Google redirects to /auth/google/callback
5. Passport verifies user exists in whitelist
6. If authorized, create session and redirect to dashboard
7. If not authorized, show error message

### Session Management
- Use express-session with SQLite store
- httpOnly cookies
- secure: true in production
- sameSite: 'lax'
- maxAge: 24 hours

### Role-Based Access
- Every API route uses `isAuthenticated` middleware
- Admin-only routes add `isAdmin` middleware
- Frontend checks user.role to show/hide admin features

### Responsive Grid Breakpoints
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns

### Icon Selection
Suggest these Lucide icons for services:
- Router: 'Router'
- Pi-hole: 'Shield', 'ShieldCheck', or 'Filter'
- Network Monitor: 'Activity', 'BarChart', or 'Monitor'
- General: 'ExternalLink', 'Globe', 'Server', 'Laptop'

### Error Handling
- All API routes should have try-catch blocks
- Return appropriate HTTP status codes (400, 401, 403, 404, 500)
- Frontend should display error messages in brutalist style
- Log errors to console with timestamps

### Security Considerations
- Validate all inputs (use express-validator)
- Sanitize URLs to prevent XSS
- Parameterized SQL queries (better-sqlite3 handles this)
- Rate limiting on auth routes (optional)
- CSRF protection via helmet

## Testing Checklist
After implementation, test:
1. ✓ Google OAuth flow works
2. ✓ Non-whitelisted users are denied access
3. ✓ Admin can add/edit/delete services
4. ✓ Read-only users cannot access admin panel
5. ✓ Services open in new tabs correctly
6. ✓ Responsive design works on mobile, tablet, desktop
7. ✓ Dark/light mode switches based on system preference
8. ✓ All brutalist styling elements are present
9. ✓ Docker container builds and runs
10. ✓ Database persists across container restarts

## Build and Run Commands

Development:
```bash
# Backend
npm install
npm run dev

# Frontend (in client/)
npm install
npm run dev
```

Production (Docker):
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up --build -d
```

## Additional Notes
- The brutalist design should feel raw and functional, not polished
- Use bright, high-contrast colors that stand out
- Typography should be bold and impactful
- Hover effects should be noticeable but not excessive
- The app should feel fast and responsive
- Minimize dependencies to keep container size small
- All sensitive configuration should be in environment variables
- Never commit .env file or database to git

## Example Workflows

### Adding First Admin User
1. Run seed script: `docker-compose exec home-dashboard node scripts/seed.js`
2. Enter Google ID (from Google account)
3. Enter email address
4. User added with admin role
5. User can now log in and access admin panel

### Adding a New Service (via Admin UI)
1. Log in as admin
2. Click settings icon
3. Go to Services Management
4. Click "Add Service"
5. Fill in name, URL, select icon
6. Save
7. Service appears on dashboard

### Adding a New User (via Admin UI)
1. Log in as admin
2. Click settings icon
3. Go to User Management
4. Click "Add User"
5. Enter email and Google ID
6. Select role (admin or readonly)
7. Save
8. User can now log in

## Success Criteria
The project is complete when:
- All files are created and properly organized
- Application builds without errors in Docker
- Users can authenticate with Google OAuth
- Whitelisting works correctly
- Admin can manage services and users
- Read-only users can view services
- Services open in new tabs
- Design follows brutalist principles with bright colors
- Responsive on all device sizes
- Dark/light mode works automatically
- Database persists across restarts

---

## Start Implementation
Please implement this project following the specifications above. Create all necessary files, implement all features, and ensure the application is production-ready for deployment in a Docker container on a local network.
