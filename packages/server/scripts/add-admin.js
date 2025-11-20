require('dotenv').config();
const User = require('../models/User');
const initializeDatabase = require('../models/init-db');

// Get email and name from command line args
const email = process.argv[2];
const name = process.argv[3] || null;

if (!email || !email.includes('@')) {
  console.error('Error: Please provide a valid email address');
  console.error('Usage: node add-admin.js <email> [name]');
  process.exit(1);
}

try {
  // Initialize database
  initializeDatabase();

  // Check if user already exists
  const existingUser = User.findByEmail(email);

  if (existingUser) {
    console.log(`User with email ${email} already exists!`);
    console.log('Updating to admin role...');
    User.updateRole(existingUser.id, 'admin');
    console.log('✓ User role updated to admin');
  } else {
    // Create new admin user
    const user = User.create(email, name, 'admin');
    console.log('✓ Admin user created successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || 'Not provided'}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  ID: ${user.id}`);
  }

  console.log(
    '\nThe user can now log in with their Google account at the dashboard.\n'
  );
} catch (error) {
  console.error('\nError creating admin user:', error.message);
  if (error.code === 'SQLITE_CONSTRAINT') {
    console.error('A user with this email already exists.');
  }
  process.exit(1);
}
