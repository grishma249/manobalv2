# Quick Start Guide

Follow these steps to get the Manobal Nepal system up and running:

## Step 1: Install MongoDB

Make sure MongoDB is installed and running on your system:
- **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- **Mac**: `brew install mongodb-community`
- **Linux**: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

Start MongoDB service:
```bash
# Windows (if installed as service, it should start automatically)
# Or use: net start MongoDB

# Mac/Linux
mongod
```

## Step 2: Set Up Backend

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` folder with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/manobal
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

   You should see: `Server is running on port 5000` and `MongoDB connected successfully`

## Step 3: Set Up Frontend

1. Open a **new terminal** and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

   You should see: `Local: http://localhost:3000`

## Step 4: Test the Application

1. Open your browser and go to: `http://localhost:3000`

2. You should see the landing page

3. Click "Register" to create a new account:
   - Choose a role: Volunteer, Donor, or School
   - Fill in all required fields
   - If registering as a School, provide the school name

4. After registration, you'll be automatically logged in and redirected to the dashboard

5. You can logout and test the login functionality

## Testing Different Roles

Try registering with different roles:
- **Volunteer**: Basic registration (name, email, password)
- **Donor**: Basic registration (name, email, password)
- **School**: Requires school name in addition to basic fields

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check if the MongoDB URI in `.env` is correct
- Try: `mongodb://127.0.0.1:27017/manobal` instead

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: Vite will automatically use the next available port

### CORS Errors
- Make sure backend is running on port 5000
- Check that frontend proxy is configured correctly in `vite.config.js`

### Module Not Found Errors
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

## Next Steps

Once login and registration are working:
- Test role-based access
- Verify JWT tokens are being stored
- Check that user data persists in MongoDB

## API Testing

You can test the API endpoints using:
- Postman
- curl commands
- Browser DevTools Network tab

Example curl for registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "volunteer"
  }'
```

Example curl for login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

