# Nini HR - Client-Side Architecture

This document outlines the file structure and directory contents of the React frontend application.

## 📂 Directory Tree

```text
client-side/src/
├── App.jsx                       # Main application component wrapper
├── main.jsx                      # React application entry point
│
├── assets/                       # Static media and graphics
│   ├── hero.png
│   ├── nini_logo.png
│   └── vite.svg
│
├── components/                   # Reusable React components
│   ├── common/                   # General utilities (Meta tags, PageTransitions, ScrollToTop)
│   ├── layout/                   # Structural page wrappers (AuthLayout, DashboardLayout, Navbar, etc.)
│   └── ui/                       # Atomic UI elements (Button, Card, Modal, Input, Table, etc.)
│
├── context/                      # React Context providers for global state
│   ├── AuthContext.jsx           # Handles user authentication and tokens
│   ├── ThemeContext.jsx          # Manages dark/light mode
│   └── ToastContext.jsx          # Manages global toast notifications
│
├── data/                         # Mock data/fixtures for frontend testing
│   ├── attendance.js
│   ├── employees.js
│   ├── leaves.js
│   └── notifications.js
│
├── hooks/                        # Custom React hooks
│   ├── useGsap.js                # Reusable GSAP animation logic
│   ├── useTheme.js               # Theme toggling logic
│   └── useUtils.js               # Utility hooks
│
├── pages/                        # Page-level components organized by domain
│   ├── app/                      # Authenticated dashboard pages (Attendance, Leaves, Profile, Settings)
│   ├── auth/                     # Authentication pages (Login, Signup, Forgot Password)
│   └── public/                   # Public marketing pages (Landing, Features, Pricing, Contact)
│
├── router/                       # Route configuration
│   ├── index.jsx                 # Main route definitions
│   └── ProtectedRoute.jsx        # Higher-order component for route guarding
│
├── services/                     # External API communication layers
│   ├── api.js                    # Base Axios instance setup
│   ├── attendanceService.js
│   ├── authService.js
│   ├── employeeService.js
│   └── leaveService.js
│
├── styles/                       # Global stylesheets
│   └── index.css                 # Tailwind v4 theme and custom CSS
│
└── utils/                        # Shared utility functions
    ├── constants.js              # Global constants (BRAND, navigation links, etc.)
    ├── formatters.js             # Data and date formatting helpers
    ├── helpers.js                # Generic helpers (like the Tailwind `cn` utility)
    └── validators.js             # Zod schemas and validation logic
```

## 🏗️ Core Domains Explained

- **`components/ui/`**: Contains all highly-polished, primitive UI elements built with Tailwind CSS v4 and Lucide React icons.
- **`pages/`**: Separates concerns effectively between public marketing landing pages, strict authentication flows, and the secure internal dashboard application.
- **`services/`**: Centralizes all backend API calls so components remain clean and focused solely on the presentation layer.
- **`context/` & `hooks/`**: Handles all the complex state management necessary for an enterprise-grade HR platform.
