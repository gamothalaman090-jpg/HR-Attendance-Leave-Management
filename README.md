# HR Attendance & Leave Management System

A modern, comprehensive HR management platform designed to streamline employee attendance tracking, leave management, and HR operations.

## 🚀 Features

### 👥 Employee Management
- **Employee Profiles**: Detailed employee records with contact information, role, and status
- **Team Management**: Organize employees into teams and departments
- **User Management**: Role-based access control (Admin, HR, Employee)

### ⏰ Attendance Management
- **Check-in/Check-out**: One-click attendance tracking
- **Real-time Status**: See who's currently working, on leave, or offline
- **Overtime Tracking**: Automatic overtime calculation based on work hours
- **Attendance History**: Comprehensive log of past attendance records

### 🌴 Leave Management
- **Leave Requests**: Submit, edit, and cancel leave applications
- **Leave Approval**: Managerial approval workflow
- **Leave Balances**: Real-time tracking of sick leave, vacation, etc.
- **Leave Calendar**: Visual overview of all team leaves

### 📊 Reporting & Analytics
- **Attendance Reports**: Generate daily, weekly, and monthly attendance summaries
- **Leave Reports**: Track leave trends and utilization
- **Export Functionality**: Export data to CSV and PDF formats
- **Dashboard Analytics**: Visual insights into workforce attendance and leave patterns

### 🔐 Security & Access
- **Secure Authentication**: Email/password login with password recovery
- **Role-Based Access Control**: Different permissions for Admin, HR, and Employees
- **Token-Based Authentication**: Secure session management

### 🎨 Modern User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Built-in system theme detection and manual toggle
- **GSAP Animations**: Smooth transitions and micro-interactions
- **Toast Notifications**: Real-time feedback for user actions
- **Progressive Web App (PWA)**: Installable on supported devices with offline capabilities
- **Advanced UI Components**: Command palette, data tables, and interactive dashboards
- **Robust Form Validation**: Client-side validation using Zod and React Hook Form

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS v4
- **Animation**: GSAP (GreenSock Animation Platform)
- **State Management**: React Query, Context API
- **Forms & Validation**: React Hook Form, Zod
- **Icons & Charts**: Lucide React, Recharts
- **Build Tool**: Vite 8
- **Routing**: React Router 7

---

## 📂 Project Structure

```
HR-Attendance-Leave-Management/
├── server/                   # Backend API
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth, validation, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── server.js           # Express server entry point
│   └── package.json
├── client-side/            # Frontend Application
│   ├── src/
│   │   ├── assets/         # Static media and graphics
│   │   ├── components/     # Reusable UI components (ui, common, layout)
│   │   ├── context/        # React Context for state management
│   │   ├── data/           # Mock data and fixtures
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components (app, auth, public)
│   │   ├── router/         # Route configuration
│   │   ├── services/       # External API communication layers
│   │   ├── styles/         # Global styles
│   │   ├── utils/          # Helper functions and validators
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── index.html          # HTML template
│   ├── package.json
│   └── vite.config.js
├── README.md               # Project documentation
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14 or higher
- npm or yarn
- MongoDB Atlas account



### 1. Frontend Setup
```bash
# Navigate to the client-side directory
cd client-side

# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Update .env with your backend API URL
# Example .env:
# VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

## 📱 Live Demo

**[Demo Link Coming Soon]**

---
