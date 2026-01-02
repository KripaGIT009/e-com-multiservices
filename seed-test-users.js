#!/usr/bin/env node

/**
 * Test User Seeding Script
 * Creates test users with different roles in the database
 * 
 * Usage: node seed-test-users.js
 */

const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8004';

const testUsers = [
  {
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN'
  },
  {
    username: 'customer1',
    email: 'customer1@example.com',
    firstName: 'John',
    lastName: 'Customer',
    role: 'CUSTOMER'
  },
  {
    username: 'customer2',
    email: 'customer2@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'CUSTOMER'
  },
  {
    username: 'customer3',
    email: 'customer3@example.com',
    firstName: 'Robert',
    lastName: 'Smith',
    role: 'CUSTOMER'
  },
  {
    username: 'guest1',
    email: 'guest1@example.com',
    firstName: 'Guest',
    lastName: 'User',
    role: 'GUEST'
  },
  {
    username: 'guest2',
    email: 'guest2@example.com',
    firstName: 'Guest',
    lastName: 'Browser',
    role: 'GUEST'
  }
];

async function seedUsers() {
  console.log('🌱 Starting test user seeding...\n');
  console.log(`📍 User Service URL: ${USER_SERVICE_URL}\n`);

  let successCount = 0;
  let failureCount = 0;
  let skipCount = 0;

  for (const user of testUsers) {
    try {
      console.log(`⏳ Creating user: ${user.username} (${user.role})...`);
      
      const response = await axios.post(`${USER_SERVICE_URL}/users`, user, {
        timeout: 5000
      });

      if (response.status === 201) {
        console.log(`✅ Successfully created: ${user.username}\n`);
        successCount++;
      } else {
        console.log(`⚠️  Unexpected response for ${user.username}: ${response.status}\n`);
        skipCount++;
      }
    } catch (error) {
      if (error.response?.status === 409 || 
          (error.response?.data && error.response.data.message && 
           error.response.data.message.includes('already exists'))) {
        console.log(`⏭️  Skipped (already exists): ${user.username}\n`);
        skipCount++;
      } else {
        console.error(`❌ Failed to create ${user.username}:`);
        console.error(`   Error: ${error.response?.data?.error || error.message}\n`);
        failureCount++;
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Seeding Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Created: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log('='.repeat(50) + '\n');

  // Print test credentials
  console.log('🔑 Test Credentials:\n');
  console.log('ADMIN User:');
  console.log('  Username: admin');
  console.log('  Email: admin@example.com');
  console.log('  Redirects to: http://localhost:3000\n');

  console.log('CUSTOMER Users:');
  testUsers.filter(u => u.role === 'CUSTOMER').forEach(user => {
    console.log(`  - ${user.username} (${user.email})`);
  });
  console.log('  Redirects to: http://localhost:4203\n');

  console.log('GUEST Users:');
  testUsers.filter(u => u.role === 'GUEST').forEach(user => {
    console.log(`  - ${user.username} (${user.email})`);
  });
  console.log('  Redirects to: http://localhost:4201\n');

  console.log('🌐 Login URL: http://localhost:4200\n');
}

seedUsers().catch(error => {
  console.error('Fatal error during seeding:', error.message);
  process.exit(1);
});
