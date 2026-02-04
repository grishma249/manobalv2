const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// Create admin user
async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manobal');
    console.log('MongoDB connected');

    // Admin credentials (you can change these)
    const adminEmail = 'admin@manobalnepal.org';
    const adminPassword = 'admin123'; // Change this password!

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('You can login with this email.');
      
      // Test if password works
      const passwordMatch = await existingAdmin.comparePassword(adminPassword);
      if (passwordMatch) {
        console.log('✅ Password is correct. You can login.');
      } else {
        console.log('⚠️  Password does not match. Resetting password...');
        existingAdmin.password = adminPassword; // Let pre-save hook hash it
        await existingAdmin.save();
        console.log('✅ Password has been reset to: admin123');
      }
      process.exit(0);
    }

    // Create admin user - let the User model's pre-save hook hash the password
    const admin = new User({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save hook
      role: 'admin',
      isActive: true,
    });
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', adminData.email);
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

