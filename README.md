# Nini HR — Premium Attendance & Leave Management System

A modern, high-fidelity, and feature-rich HR Management Platform designed to streamline employee check-ins, dynamic leave workflows, and organizational announcements. 

Nini HR is built as a **fully integrated client-server application** featuring a Node.js/Express backend, MongoDB database, multi-tenant isolation, and a decoupled Superadmin console.

---

## ✨ Features & Architecture

### 🔐 Authentication & Dynamic RBAC (Multi-Tenant)
Nini HR features an active role-based routing engine (`ProtectedRoute`) and strict company-based data isolation:
- **Superadmin Console**: Decoupled standalone app for cross-tenant user authorization and server logs diagnostics.
- **HR & Administrative Portal**: Comprehensive view of company-wide analytics, leave approvals, employee directory, payroll runs, and announcement creation.
- **Employee Staff Portal**: Personalized dashboard displaying check-in rates, leave request manager, private leave balances, and team announcements.

### ⏰ Attendance & Check-In System
- **One-Click Clocking**: Punch in/out dynamically. Real-time status tags are updated in the directory.
- **Smart Analytics**: Automated calculation of average weekly hours, attendance rates, and overtime trackers.

### 🌴 Dynamic Leave Workflows
- **Request Form**: Interactive leave scheduler validating days, overlaps, and balances.
- **Dynamic Identity**: Form submissions automatically inherit the signed-in employee's identity and are scoped by company.
- **Approval Queue**: HR managers can approve or reject pending requests, immediately updating the individual balances.

### 📢 Broadcast Announcements & Departments
- Create and pin high-priority announcements company-wide.
- Real-time read/unread status badges for team members.
- Full company-scoped department CRUD with validation rules and cascade updates.

### ⚡ Package & Tier Guardrails (Starter Tier)
- Enforces a strict **10-employee limit** per company/workspace.
- Validated both client-side (disables creation modal) and backend-side (blocks registrations, manual creations, and Google OAuth provision requests once capacity is reached).

---

## 🎨 Premium Design System

Nini HR features a gorgeous, bespoke UI design built from the ground up:
- **HSL Theme Engine**: Seamless manual and system-level dark mode synchronizations with native dropdown contrast optimizations.
- **Glassmorphism Panels**: Modern frosted surface overlays (`backdrop-filter`) paired with harmonious gradients.
- **Micro-Animations**: Fluid transitions using customized GSAP (GreenSock Animation Platform) viewport entries.
- **Installable PWA**: Responsive offline-ready Progressive Web App configuration.

---

## 📂 Folder Structure

```
HR-Attendance-Leave-Management/
├── client-side/               # Frontend React Application
│   ├── src/
│   │   ├── assets/            # High-resolution media, icons, and logos
│   │   ├── components/        # UI kit, page layouts, and common wrappers
│   │   ├── context/           # State context providers (Auth, Theme)
│   │   ├── hooks/             # Custom utility hooks (GSAP wrappers)
│   │   ├── pages/             # App routing screens (Dashboard, Leave, Reports)
│   │   ├── router/            # Protected and public route configs
│   │   ├── services/          # API services communicating with the backend
│   │   ├── styles/            # CSS variable tokens and animation rules
│   │   ├── utils/             # Formatters and input validators
│   │   ├── App.jsx            # Main app router wrapper
│   │   └── main.jsx           # App mounting entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Bundler & PWA configurations
├── superadmin-side/           # Decoupled Superadmin Console Application
│   ├── src/
│   │   ├── components/        # Console specific components
│   │   ├── context/           # Authentication state context
│   │   ├── pages/             # Superadmin specific dashboard and logs viewer
│   │   ├── services/          # Log and user management API service clients
│   │   ├── App.jsx            # Console app router wrapper
│   │   └── main.jsx           # Console app mounting entry point
│   └── package.json           # Superadmin console dependencies
├── server/                    # Node.js Express Backend
│   ├── config/                # Database and middleware configs
│   ├── controllers/           # API request controllers
│   ├── middlewares/           # JWT, role-based, and validation middlewares
│   ├── models/                # MongoDB Schema models
│   ├── routes/                # Express API router definitions
│   ├── scripts/               # Seeding and database utility scripts
│   ├── server.js              # Server entry point
│   └── package.json           # Server-side dependencies
├── README.md                  # Project documentation
└── .gitignore
```

---

## 📦 Dependencies Overview

### 💻 Client-Side (Frontend React SPA)

| Dependency | Purpose |
| :--- | :--- |
| **`react` & `react-dom`** (v19) | Main UI component library and DOM rendering client. |
| **`react-router-dom`** | Client-side routing, query state parsing, and route guards. |
| **`@tanstack/react-query`** | Query caching, optimistic UI updates, and server synchronization state. |
| **`gsap`** | GreenSock Animation Platform for premium layout entries and page transitions. |
| **`recharts`** | Beautiful D3-based charting widgets for dashboards and reporting modules. |
| **`react-hook-form` & `@hookform/resolvers`** | Performant, schema-validated input form controller state. |
| **`zod`** | Schema-first object parsing and client form input validation. |
| **`xlsx`** (SheetJS) | Client-side Excel spreadsheet parser/generator for payroll reports exports. |
| **`axios`** | HTTP request client for communication with backend routers. |
| **`lucide-react`** | High-quality customizable SVG icon components library. |
| **`react-error-boundary`** | Declarative React error interception boundary wrappers. |
| **`tailwindcss` & `@tailwindcss/vite`** (v4) | Utility-first styling framework and lightning-fast Vite compilation plugin. |
| **`vite-plugin-pwa`** | Automated Progressive Web App configurations and offline asset caching. |

### 🗄️ Server-Side (Node.js & Express API)

| Dependency | Purpose |
| :--- | :--- |
| **`express`** (v5) | Fast, opinionated backend router and API framework. |
| **`mongoose`** | MongoDB Object Document Mapper (ODM) for database models and validation. |
| **`jsonwebtoken`** | Creation and validation of encrypted JWT tokens for authentication. |
| **`bcryptjs`** | Secure hashing and verification of employee login passwords. |
| **`nodemailer`** | General SMTP email sending integrations. |
| **`resend`** | Dedicated transactional email delivery service API client. |
| **`multer` & `multer-storage-cloudinary`** | Handling multipart form data and direct image uploads. |
| **`cloudinary`** | Storage manager integration for hosting employee profile avatars. |
| **`cors`** | Cross-Origin Resource Sharing middleware wrapper. |
| **`dotenv`** | Zero-dependency environment variable parser. |
| **`morgan`** | High-performance console HTTP request logger middleware. |
| **`nodemon`** (dev) | File watcher for live server auto-reloading during development. |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas cluster)

### 1. Server Configuration
Create `server/.env` with your Mongo URI:
```env
PORT=8000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
# Optional: Resend API keys, Cloudinary configuration, etc.
```

Install packages and seed the database:
```bash
cd server
npm install
npm run seed
npm run dev
```
The server will start on port `8000`.

### 2. Client-Side configuration
Create `client-side/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

Install and run the web app:
```bash
cd client-side
npm install
npm run dev
```
Open **`http://localhost:5173`** to access the login portal.

### 3. Superadmin-Side configuration
Create `superadmin-side/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

Install and run the superadmin console:
```bash
cd superadmin-side
npm install
npm run dev
```
Open **`http://localhost:5174`** to access the Superadmin diagnostic console.

---

## 📦 Build & Production

To generate fully optimized production builds for the client-side and superadmin-side:
```bash
# In client-side / superadmin-side
npm run build
```
