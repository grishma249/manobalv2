# Manobal Nepal - NGO Management System

A web-based platform for managing NGO operations, connecting donors, volunteers, partner schools, and administrators.

## Project Structure

```
manobal/
├── backend/          # Node.js + Express API
├── frontend/         # React frontend application
└── README.md         # This file
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/manobal
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   ```

4. Make sure MongoDB is running on your system.

5. Start the backend server:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## Features Implemented

### Authentication & Registration
- ✅ User registration with role selection (Donor, Volunteer, School)
- ✅ Email and password-based login
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ Protected routes

### User Roles
- **Admin**: Full system control (to be implemented)
- **Donor**: Can log donations (to be implemented)
- **Volunteer**: Can participate in events (to be implemented)
- **School**: Can request events (to be implemented)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Vite as build tool

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

## Next Steps

The following features are planned for future implementation:
- Event management system
- Donation tracking
- Volunteer participation management
- Admin dashboard with metrics
- School event request system

## License

ISC

