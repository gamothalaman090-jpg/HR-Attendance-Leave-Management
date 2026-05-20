# Nini HR — Premium Attendance & Leave Management System

A modern, high-fidelity, and feature-rich HR Management Platform designed to streamline employee check-ins, dynamic leave workflows, and organizational announcements. 

Nini HR is built as a **fully standalone, client-persisted web application** featuring a bespoke glassmorphism aesthetic, robust Role-Based Access Control (RBAC), and a simulated backend engine powered by `localStorage` and React Query.

---

## ✨ Features & Architecture

### 🔐 Simulated Authentication & Dynamic RBAC
Nini HR features an active role-based routing engine (`ProtectedRoute`) that dynamically customizes the user experience:
- **HR & Administrative Portal**: Comprehensive view of company-wide analytics, leave approval logs, edit capabilities for the team directory, and global announcements publishing.
- **Employee Staff Portal**: Personalized dashboard displaying title, department, personal attendance rates, private leave balances (Annual, Sick, Personal), and a dedicated calendar to submit leave requests.

### ⏰ Attendance & Check-In System
- **One-Click Clocking**: Punch in/out dynamically. Real-time status tags are updated in the directory.
- **Smart Analytics**: Automated calculation of average weekly hours, attendance rates, and overtime trackers.

### 🌴 Dynamic Leave Workflows
- **Request Form**: Interactive leave scheduler validating days, overlaps, and balances.
- **Dynamic Identity**: Form submissions automatically inherit the signed-in employee's ID and Name (no hardcoded payloads).
- **Approval Queue**: HR managers can approve or reject pending requests, immediately updating the individual balances.

### 📢 Broadcast Announcements
- Create and pin high-priority announcements company-wide.
- Real-time read/unread status badges for team members.

### ⚡ Package & Tier Guardrails (Starter Tier)
- Enforces a strict **10-employee limit** on the *Starter Tier* package.
- Seed data and directory creations are limited to prevent structural locks.

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
│   │   ├── data/              # Pre-seeded mock directories (Employees, Leaves)
│   │   ├── hooks/             # Custom utility hooks (GSAP wrappers)
│   │   ├── pages/             # App routing screens (Dashboard, Leave, Reports)
│   │   ├── router/            # Protected and public route configs
│   │   ├── services/          # Simulated API services with persistence
│   │   ├── styles/            # CSS variable tokens and animation rules
│   │   ├── utils/             # Formatters and input validators
│   │   ├── App.jsx            # Main app router wrapper
│   │   └── main.jsx           # App mounting entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Bundler & PWA configurations
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

## 🔑 Login Simulation Credentials

To experience both sides of the platform, use the credentials below. **Any password of at least 6 characters** is accepted:

| User Identity | Email Address | Assigned Role | Access Level |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | `alex.rivera@nini.io` | HR Manager | **Administrative** (Full Access) |
| **Sarah Chen** | `sarah.chen@nini.io` | Lead AI Engineer | **Employee** (Restricted Personal View) |
| **James Kim** | `james.kim@nini.io` | Principal UX Designer | **Employee** (Restricted Personal View) |
| **Alex Mercer** | `alex.mercer@nini.io` | Security Engineer | **Employee** (Restricted Personal View) |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Install Dependencies
Navigate into the `client-side` directory and install the necessary npm packages:
```powershell
cd client-side
npm install
```

### 2. Run the Development Server
Fire up the Vite development server locally:
```powershell
npm run dev
```
Open your browser and navigate to **`http://localhost:5173`** to access the login portal.

### 3. Build & Production Check
Generate a fully optimized production bundle:
```powershell
npm run build
```
This compiles the application assets, validates imports, and registers service workers for installable PWA compliance.

