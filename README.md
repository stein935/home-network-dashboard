# Home Network Dashboard

A brutalist-designed home network dashboard with Google OAuth authentication, role-based access control, and an admin interface for managing services. Built with React, Express, and SQLite.

## Features

- **Google OAuth Authentication**: Secure login with Google accounts
- **Role-Based Access Control**: Admin and read-only user roles
- **Service Management**: Add, edit, and delete network service links
- **User Whitelist**: Control who can access your dashboard
- **Brutalist Design**: Bold, high-contrast UI with bright accent colors
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatically follows system preference
- **Docker Deployment**: Easy deployment with Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- A Google Cloud account for OAuth setup
- Node.js 18+ (for local development)

## Google OAuth Setup

Before you can run the application, you need to set up Google OAuth credentials:

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name it "Home Network Dashboard"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "Internal" (if using Google Workspace) or "External"
   - Fill in application name: "Home Network Dashboard"
   - Add your email as developer contact
   - Click "Save and Continue"

5. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Home Dashboard Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3030` (for local testing)
     - `http://your-server-ip:3030` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3030/auth/google/callback`
     - `http://your-server-ip:3030/auth/google/callback`
   - Click "Create"

6. **Save Your Credentials**
   - Copy the "Client ID" and "Client Secret"
   - You'll need these for the `.env` file

## Installation

### 1. Clone or Download the Project

```bash
cd home-network-dashboard
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NODE_ENV=production
PORT=3030

# Paste your Google OAuth credentials here
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Update with your server's IP or domain
GOOGLE_CALLBACK_URL=http://192.168.1.100:3030/auth/google/callback

# Generate a random secret (use: openssl rand -base64 32)
SESSION_SECRET=your_random_secret_here

DATABASE_PATH=/data/database.db
```

### 3. Add Your First Admin User

Before starting the application, you need to add yourself as an admin user:

```bash
# Install dependencies first
npm install

# Run the seed script
npm run seed
```

The script will prompt you for:
- Your email address (the one you'll use to log in with Google)
- Your Google ID (you can find this by temporarily logging in and checking the browser developer console, or use a Google ID lookup tool)
- Your name (optional)

**Finding Your Google ID:**
- Easiest method: After setting up OAuth, attempt to login. Check the browser console Network tab for the OAuth response which includes your Google ID.
- Alternative: Use a temporary script or online tool to fetch your Google profile ID.

### 4. Build and Run with Docker

```bash
# Build and start the container
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3030` or `http://your-server-ip:3030`

## Usage

### First Login

1. Navigate to `http://your-server-ip:3030`
2. You'll be redirected to Google OAuth login
3. Sign in with the Google account you added as admin
4. You'll be redirected back to the dashboard

### Managing Services

As an admin user:

1. Click the "Admin" button in the top right
2. Go to the "Services" tab
3. Click "Add Service" to create a new service
4. Fill in:
   - **Name**: Display name (e.g., "Router Admin")
   - **URL**: Full URL including http:// or https://
   - **Icon**: Select from available Lucide icons
   - **Display Order**: Number determining card position
5. Click "Create"

Services will appear as cards on the main dashboard. Click any card to open the service in a new tab.

### Managing Users

As an admin user:

1. Click the "Admin" button
2. Go to the "Users" tab
3. Click "Add User"
4. Enter the user's:
   - Email address
   - Google ID
   - Name (optional)
   - Role (Admin or Read Only)
5. Click "Add User"

**User Roles:**
- **Admin**: Can manage services and users
- **Read Only**: Can only view and access services

### Removing Access

To remove a user's access:
1. Go to Admin → Users
2. Click the trash icon next to the user
3. Confirm deletion

## Development

### Local Development Setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Run backend (terminal 1)
npm run dev

# Run frontend dev server (terminal 2)
cd client
npm run dev
```

Backend runs on `http://localhost:3030`
Frontend dev server runs on `http://localhost:5173`

### Project Structure

```
home-network-dashboard/
├── server/               # Backend Express server
│   ├── config/          # Database and Passport configuration
│   ├── middleware/      # Auth and admin middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── server.js        # Main server file
├── client/              # Frontend React app
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Auth context
│       ├── hooks/       # Custom hooks
│       ├── utils/       # API utilities
│       └── styles/      # Tailwind CSS
├── scripts/             # Utility scripts
│   └── seed.js         # Admin user setup
├── data/               # SQLite database (created at runtime)
├── Dockerfile
├── docker-compose.yml
└── .env                # Environment variables
```

## Troubleshooting

### "User not authorized" Error

- Make sure you've added your Google account to the whitelist using `npm run seed`
- Verify the email matches exactly with your Google account

### OAuth Redirect Error

- Check that your `GOOGLE_CALLBACK_URL` in `.env` matches the redirect URI in Google Cloud Console
- Ensure the URL includes the protocol (`http://` or `https://`)

### Database Locked Error

- Stop all running instances: `docker-compose down`
- Remove lock: `rm data/*.db-*`
- Restart: `docker-compose up -d`

### Can't Access Dashboard

- Verify the container is running: `docker-compose ps`
- Check logs: `docker-compose logs -f`
- Ensure port 3030 is not blocked by firewall
- Verify `.env` file exists and has correct values

### Services Not Loading

- Check browser console for errors
- Verify you're logged in (check `/auth/user` endpoint)
- Check backend logs: `docker-compose logs -f`

## Security Notes

- Never commit `.env` file to git
- Keep your `SESSION_SECRET` secure and random
- Use HTTPS in production (consider a reverse proxy like Nginx)
- Regularly review user access list
- Keep Docker images updated

## Customization

### Changing Colors

Edit `client/tailwind.config.js` to customize the color palette:

```javascript
colors: {
  dark: {
    bg: '#1a1a1a',
    accent1: '#ff00ff',  // Change accent colors
    // ...
  }
}
```

### Adding More Icons

The application uses [Lucide React](https://lucide.dev/icons/) icons. All icon names in the dropdown correspond to Lucide icon components.

### Changing Default Services

Edit `server/models/init-db.js` to modify the default services that are seeded on first run.

## License

MIT License - Feel free to use and modify for your home network!

## Support

For issues and questions, please check:
- Google OAuth setup documentation
- Docker documentation
- Express.js documentation
- React documentation

---

Built with brutalist design principles - bold, functional, and unapologetic.
