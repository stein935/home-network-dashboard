require('dotenv').config();
const readline = require('readline');
const User = require('../server/models/User');
const initializeDatabase = require('../server/models/init-db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function seedAdmin() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Home Network Dashboard - Admin User Setup       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    // Initialize database
    initializeDatabase();

    console.log(
      'To add an admin user, simply enter their Google email address.\n'
    );
    console.log('The user will be able to log in with their Google account.\n');

    const email = await question('Enter user email: ');
    if (!email || !email.includes('@')) {
      console.error('Error: Invalid email address');
      rl.close();
      return;
    }

    const name = await question(
      'Enter user name (optional, press Enter to skip): '
    );

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
      const user = User.create(email, name || null, 'admin');
      console.log('\n✓ Admin user created successfully!');
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
  } finally {
    rl.close();
  }
}

seedAdmin();
