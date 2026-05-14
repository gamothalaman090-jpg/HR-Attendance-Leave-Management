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
- **Dark Mode**: Built-in theme toggle with Tailwind CSS
- **GSAP Animations**: Smooth transitions and micro-interactions
- **Toast Notifications**: Real-time feedback for user actions

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS 4
- **Animation**: GSAP (GreenSock Animation Platform)
- **Build Tool**: Vite
- **Routing**: React Router

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
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context for state management
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── router/         # Route configuration
│   │   ├── styles/         # Global styles
│   │   ├── utils/          # Helper functions
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues or questions, please open an issue in the repository.

---

## 📱 Live Demo

**[Demo Link Coming Soon]**

---
