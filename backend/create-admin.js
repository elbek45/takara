/**
 * Create Admin User Script
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔑 Creating admin user...');

    // Admin wallet address (you should replace this with your actual admin wallet)
    const adminWallet = 'ADMIN_WALLET_ADDRESS_HERE';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.walletAddress);
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        walletAddress: adminWallet,
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('Wallet:', admin.walletAddress);
    console.log('Role:', admin.role);
    console.log('\n📝 Instructions:');
    console.log('1. Connect to the app with wallet:', adminWallet);
    console.log('2. Navigate to /admin to access admin panel');
    console.log('3. Or update this wallet address to your own Phantom wallet\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
