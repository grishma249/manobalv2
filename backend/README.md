# Manobal Backend API

Backend API for Manobal Nepal NGO Management System.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/manobal
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   ```

3. Start MongoDB service

4. Run the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "volunteer",  // "donor" | "volunteer" | "school"
  "schoolName": "School Name"  // Required only if role is "school"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <token>
```

## Project Structure

```
backend/
├── models/          # Mongoose models
│   └── User.js
├── routes/          # API routes
│   └── auth.js
├── middleware/      # Custom middleware
│   └── auth.js
├── server.js        # Entry point
└── package.json
```

