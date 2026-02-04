const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

// Verify admin user exists and can login
async function verifyAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manobal');
    console.log('MongoDB connected');

    const admin = await User.findOne({ email: 'admin@manobalnepal.org' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('Run: npm run create-admin');
      process.exit(1);
    }

    console.log('✅ Admin user found!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('Active:', admin.isActive);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Test password
    const testPassword = await admin.comparePassword('admin123');
    if (testPassword) {
      console.log('✅ Password "admin123" is correct!');
      console.log('You can login with these credentials.');
    } else {
      console.log('❌ Password "admin123" does not match!');
      console.log('Run: npm run create-admin to reset password');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAdmin();

