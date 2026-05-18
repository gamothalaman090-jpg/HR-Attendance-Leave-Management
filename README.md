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
├── README.md                  # Project documentation
└── .gitignore
```

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

