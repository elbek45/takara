/**
 * Takara DeFi Platform - Admin Initialization Script
 * Creates the first superadmin user with secure bcrypt password hashing
 *
 * Usage:
 *   node src/database/init-admin.js <username> <password> [email]
 *
 * Example:
 *   node src/database/init-admin.js admin SecureP@ssw0rd! admin@takara.com
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Get BCRYPT_ROUNDS from environment or default to 12
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function initializeAdmin() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error('❌ Usage: node src/database/init-admin.js <username> <password> [email]');
      console.error('   Example: node src/database/init-admin.js admin SecureP@ssw0rd! admin@takara.com');
      process.exit(1);
    }

    const [username, password, email] = args;

    // Validate password strength
    if (password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      console.error(`❌ Error: Admin with username "${username}" already exists`);
      console.error('   Use a different username or delete the existing admin first');
      process.exit(1);
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create the admin user
    console.log('👤 Creating admin user...');
    const admin = await prisma.admin.create({
      data: {
        username,
        email: email || null,
        passwordHash,
        role: 'superadmin',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   ID:        ${admin.id}`);
    console.log(`   Username:  ${admin.username}`);
    console.log(`   Email:     ${admin.email || 'N/A'}`);
    console.log(`   Role:      ${admin.role}`);
    console.log(`   Active:    ${admin.isActive}`);
    console.log(`   Created:   ${admin.createdAt}`);
    console.log('\n🔑 Credentials:');
    console.log(`   Username:  ${admin.username}`);
    console.log(`   Password:  ${password}`);
    console.log('\n⚠️  IMPORTANT: Save these credentials securely and delete this message!');
    console.log('   The password cannot be retrieved later.\n');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeAdmin();
