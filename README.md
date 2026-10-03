# 📜 Phoenix-Scroll — Digital Publishing & Storybook Platform

Phoenix-Scroll is a web application designed for reading, writing, and publishing digital stories and multi-chapter books. Built with a responsive React frontend and a Node.js/Express MongoDB backend, it offers immersive reading controls, rich chapter editing, and server-side access controls.

---

## ✨ Features

- 📖 **Dual Reading Modes**:
  - **Interactive Book Page Mode**: Simulated page turn animations with single and dual-page layouts (Default for Desktop).
  - **Continuous Scroll Mode**: Vertical reading experience optimized for touch devices (Default for Mobile).
- ✍️ **Rich Chapter Editor**: Full rich-text formatting, custom Part & Arc banners, image uploads, and document import support (`.pdf` & `.docx`).
- 🔐 **Authentication & Security**:
  - Email & Password registration with OTP email verification.
  - Google Sign-In (Google Identity Services / OAuth2) with backend ID token & audience verification.
  - JWT session authorization with environment variable enforcement.
  - Passcode-protected stories and author-only private drafts.
  - Complete backend authorization checks preventing IDOR / unauthorized manuscript access.
  - XSS protection via server-side `sanitize-html` filtering.
- 🎨 **Personalized Reader Controls**: Customizable reading themes (Parchment, Paper, Sepia, Night), font families (Garamond, Lora, Playfair, Sans), font sizing, line height, and margin width.
- 📊 **Progress & Bookmarking**: Automatic scroll position tracking, chapter completion state, and reading history across devices.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite 5 (TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion & Canvas Confetti

### Backend
- **Runtime**: Node.js + Express (TypeScript)
- **Database**: MongoDB via Mongoose
- **Authentication**: JSON Web Tokens (JWT), Bcrypt password hashing, Google OAuth
- **Security & Utilities**: Helmet, Express Rate Limit, Sanitize-HTML, Nodemailer, Mammoth (`.docx`), PDF-Parse (`.pdf`), Multer

---

## 📁 Project Structure

```
storybook/
├── frontend/                # Vite React application
│   ├── src/
│   │   ├── components/      # UI components (reader, editor, dashboard, common)
│   │   ├── context/         # Auth, Reader, and Toast React Context providers
│   │   ├── pages/           # Page routes (Home, Reader, Editor, Login, Register)
│   │   ├── services/        # Axios API client services
│   │   └── types/           # TypeScript interface definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Express Node.js application
│   ├── src/
│   │   ├── config/          # Database & JWT configuration
│   │   ├── controllers/     # API request handlers (Auth, Story, Chapter, Progress)
│   │   ├── middleware/      # Auth, CORS, Helmet, Rate Limiter, Error handler
│   │   ├── models/          # Mongoose schema definitions
│   │   ├── routes/          # Express API route endpoints
│   │   └── utils/           # HTML Sanitization, Email service, Data seeders
│   ├── package.json
│   └── server.ts
├── package.json             # Root workspace package script runner
└── README.md
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/storybook

# Email OTP Service Configuration
EMAIL_USER=your.app@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=Phoenix-Scroll <your.app@gmail.com>
OTP_EXPIRY=300000
OTP_RESEND_COOLDOWN=120000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
```

For frontend configuration (optional), create `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas cluster or local MongoDB instance

### 1. Installation

Install dependencies for all workspace packages from the root directory:

```bash
npm run install-all
```

*(Or run `npm install` inside both `frontend` and `backend` directories)*.

### 2. Development Mode

Run both frontend and backend concurrently in development mode:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 📦 Production Build & Deployment

To compile the TypeScript code and generate static production bundles:

```bash
npm run build
```

To start the compiled production server:

```bash
npm run start
```

The Express server will automatically serve the compiled frontend bundle from `frontend/dist` and handle API routes under `/api`.

---

## 🔒 Security Architecture Highlights

- **JWT Enforcement**: Strict environment variable requirement (`JWT_SECRET`) without hardcoded string fallbacks.
- **CORS Protection**: Explicit origin allowlist filtering in Express CORS middleware.
- **Backend IDOR Protection**: Server-side user identity verification on all private story, chapter, and progress endpoints.
- **XSS Prevention**: HTML manuscript content filtered via server-side `sanitize-html` whitelist before database persistence.
- **HTTP Security Headers**: Configured via `helmet` (`crossOriginResourcePolicy`, `frameguard: sameorigin`).

---

## 📄 License

This project is licensed under the MIT License.
