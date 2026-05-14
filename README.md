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

### Backend
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt.js for password hashing
- **Validation**: express-validator

### Deployment
- **Platform**: Render (Frontend & Backend)
- **Database**: Render MongoDB Atlas

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

### 1. Backend Setup
```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create .env file from .env.example
cp .env.example .env

# Update .env with your MongoDB connection string and JWT secret
# Example .env:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000

# Start the server
npm start
```

The backend will start at `http://localhost:5000` (or your configured port).

### 2. Frontend Setup
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

The frontend will be available at `http://localhost:5173` (or your configured port).

### 3. Usage
1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. Use the following credentials to login:
   - **Email**: [EMAIL_ADDRESS]`
   - **Password**: `password`
3. Explore the dashboard and features

---

## 📂 Environment Variables

### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=HR Manager
VITE_VERSION=1.0.0
```

---

## 🌐 Deployment

### Backend Deployment (Render)
1. Create a new **Web Service** on Render
2. Connect your backend GitHub repository
3. Configure build settings:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (set to `8080` for Render)
5. Deploy the service

### Frontend Deployment (Render)
1. Create a new **Web Service** on Render
2. Connect your frontend GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Start command: `npm run preview`
4. Add environment variables:
   - `VITE_API_URL` (point to your backend URL)
5. Deploy the service

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues or questions, please open an issue in the repository.

---

## 🙏 Acknowledgments

- Thanks to the React and Node.js communities for the amazing tools
- Built with Tailwind CSS for rapid UI development
- GSAP for beautiful animations
- Render for easy deployment

---

## 📝 Notes

- Default Admin credentials: [EMAIL_ADDRESS]` / `password`
- The application uses RESTful API architecture
- All endpoints are prefixed with `/api`
- JWT tokens are valid for 24 hours
- Password reset functionality is implemented
- Error handling is centralized for consistent responses

---

## 📱 Live Demo

**[Demo Link Coming Soon]**

---

**Made with ❤️ using React and Node.js**

**Happy Coding!** 🚀
