require('dotenv').config();
const readline = require('readline');
const User = require('../server/models/User');
const initializeDatabase = require('../server/models/init-db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function seedAdmin() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   Home Network Dashboard - Admin User Setup       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Initialize database
    initializeDatabase();

    console.log('To add an admin user, you need their Google ID and email.\n');
    console.log('You can get the Google ID by:');
    console.log('1. Going to https://myaccount.google.com/');
    console.log('2. Clicking on "Personal info"');
    console.log('3. Or use developer tools to inspect the OAuth response\n');

    const email = await question('Enter user email: ');
    if (!email || !email.includes('@')) {
      console.error('Error: Invalid email address');
      rl.close();
      return;
    }

    const googleId = await question('Enter Google ID: ');
    if (!googleId) {
      console.error('Error: Google ID is required');
      rl.close();
      return;
    }

    const name = await question('Enter user name (optional, press Enter to skip): ');

    // Check if user already exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      console.log(`\nUser with email ${email} already exists!`);
      const update = await question('Update to admin role? (y/n): ');
      if (update.toLowerCase() === 'y') {
        User.updateRole(existingUser.id, 'admin');
        console.log('✓ User role updated to admin');
      } else {
        console.log('No changes made');
      }
    } else {
      // Create new admin user
      const user = User.create(googleId, email, name || email, 'admin');
      console.log('\n✓ Admin user created successfully!');
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user.id}`);
    }

    console.log('\nYou can now log in with this Google account at the dashboard.\n');

  } catch (error) {
    console.error('\nError creating admin user:', error.message);
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.error('A user with this Google ID or email already exists.');
    }
  } finally {
    rl.close();
  }
}

seedAdmin();
