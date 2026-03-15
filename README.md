# ConnectSphere – MERN Stack App

A smart communication platform with real-time chat, live location sharing, and safety features.

## Tech Stack
- **Frontend**: React 18 + Vite, React Router v6, Socket.IO Client, Axios
- **Backend**: Node.js, Express.js, Socket.IO, Mongoose
- **Database**: MongoDB
- **Auth**: JWT (JSON Web Tokens)
- **Maps**: OpenStreetMap static tiles (Google Maps API ready)

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- MongoDB (optional – app runs in demo mode without it)

### 1. Simple Start
Run the following in the project root:
```bash
./run.sh
```
This script will clear port conflicts and start both services concurrently.

### 2. Manual Start (Alternative)
```bash
npm install
npm run dev
```
- Backend starts at **http://localhost:5001**
- Frontend starts at **http://localhost:5173**

### 3. Open in Browser
Visit `http://localhost:5173`

Use **Demo Account** button on the login page, or register a new account.

---

## Project Structure
```
ConnectSphere Codes/
├── frontend/
│   └── src/
│       ├── components/          # Reusable UI components
│       │   ├── NavigationSidebar.jsx
│       │   ├── BottomNav.jsx
│       │   ├── ChatCard.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── MapPreview.jsx
│       │   ├── LocationShareModal.jsx
│       │   ├── SOSButton.jsx
│       │   ├── SearchBar.jsx
│       │   ├── Avatar.jsx
│       │   └── NotificationBadge.jsx
│       ├── context/             # React Context providers
│       │   ├── AuthContext.jsx  (JWT + login/register)
│       │   ├── ChatContext.jsx  (Socket.IO + messages)
│       │   └── LocationContext.jsx (Geolocation + sharing)
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── DashboardPage.jsx
│           ├── ChatPage.jsx
│           ├── MapPage.jsx
│           └── ProfilePage.jsx
│
└── backend/
    ├── server.js               # Express + Socket.IO entry
    ├── models/                 # Mongoose schemas
    │   ├── User.js
    │   ├── Message.js
    │   └── Room.js
    ├── routes/                 # REST API routes
    │   ├── auth.js    (/api/auth)
    │   ├── users.js   (/api/users)
    │   ├── rooms.js   (/api/rooms)
    │   └── location.js (/api/location)
    ├── middleware/
    │   └── auth.js             # JWT middleware
    └── socket/
        └── handlers.js         # Socket.IO event handlers
```

## Features
- ✅ Real-time messaging with Socket.IO
- ✅ JWT authentication (register / login)
- ✅ Live location sharing with duration controls
- ✅ Emergency SOS button (hold-to-activate)
- ✅ Map previews (OpenStreetMap)
- ✅ Mobile-first responsive layout (bottom nav on mobile)
- ✅ Desktop sidebar with hover-expand
- ✅ Glassmorphism UI, blue-purple theme, smooth animations

## HCI Principles Applied
| Principle | Implementation |
|-----------|---------------|
| Visibility of status | Online indicators, read receipts, connection banner |
| User control | Clear back button, cancel modals, stop-sharing button |
| Recognition not recall | Icons + labels on all nav items |
| Consistency | Unified color system, radius, shadow tokens |
| Error prevention | Form validation with inline hints |
| Accessibility | ARIA labels, focus-visible, keyboard nav, sr-only |
| Minimal cognitive load | Card-based layout, grouped messages, clean whitespace |

## Google Maps Setup
To use Google Maps instead of OpenStreetMap:
1. Get a Maps JavaScript API key from [Google Cloud Console](https://console.cloud.google.com)
2. Add `VITE_GOOGLE_MAPS_KEY=your_key` to `frontend/.env`
3. Update `MapPreview.jsx` to use `@react-google-maps/api`
