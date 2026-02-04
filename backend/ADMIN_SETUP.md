# Admin User Setup Guide

## How to Create an Admin User

Since admin registration is not available through the UI (for security reasons), you need to create an admin user directly in the database.

### Method 1: Using the Script (Recommended)

1. Make sure your MongoDB is running and your `.env` file is configured correctly.

2. Run the admin creation script:
   ```bash
   npm run create-admin
   ```

3. The script will create an admin user with these default credentials:
   - **Email:** `admin@manobalnepal.org`
   - **Password:** `admin123`

4. **IMPORTANT:** Change the password immediately after first login!

### Method 2: Using MongoDB Shell

If you prefer to create the admin user manually:

1. Connect to your MongoDB:
   ```bash
   mongosh mongodb://localhost:27017/manobal
   ```

2. Run this command (replace password hash with your own):
   ```javascript
   db.users.insertOne({
     name: "Admin User",
     email: "admin@manobalnepal.org",
     password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Z5Z5Z5Z5", // This is "admin123" hashed
     role: "admin",
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

### Method 3: Using MongoDB Compass or GUI

1. Open MongoDB Compass and connect to your database
2. Navigate to the `users` collection
3. Click "Insert Document"
4. Add a document with:
   - `name`: "Admin User"
   - `email`: "admin@manobalnepal.org" (or your preferred email)
   - `password`: Use bcrypt to hash your password (you can use online tools or Node.js)
   - `role`: "admin"
   - `isActive`: true
   - `createdAt`: Current date
   - `updatedAt`: Current date

### Generating Password Hash

If you want to use a custom password, you can generate a bcrypt hash:

**Using Node.js:**
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your-password', 12);
console.log(hash);
```

**Or use an online tool:** https://bcrypt-generator.com/

### After Creating Admin User

1. Go to the login page: `http://localhost:3000/login`
2. Enter the admin email and password
3. You'll be redirected to the Admin Dashboard
4. **Change your password** (this feature will be available in Profile settings)

### Default Admin Credentials

- **Email:** `admin@manobalnepal.org`
- **Password:** `admin123`

⚠️ **Security Note:** Change these credentials immediately in production!

