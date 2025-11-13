/**
 * Takara DeFi Platform - Database Seed Script
 * Заполняет базу данных начальными данными:
 * - 3 инвестиционных пула (12, 24, 36 месяцев)
 * - Настройки платформы
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Очистка существующих данных (опционально, для dev окружения)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  Cleaning existing data...');
    await prisma.platformSetting.deleteMany({});
    await prisma.pool.deleteMany({});
    console.log('✅ Cleaned\n');
  }

  // ========================================
  // Создание инвестиционных пулов
  // ========================================
  console.log('📊 Creating investment pools...');

  const pool1 = await prisma.pool.create({
    data: {
      name: 'Pool 1 - 12 Months',
      durationMonths: 12,
      takaraMultiplier: 1.0,
      usdtApy: 7.0,
      minInvestment: 100,
      targetAmount: 100000,
      currentAmount: 0,
      status: 'pending',
      isActive: true,
    },
  });
  console.log(`✅ Created: ${pool1.name} (ID: ${pool1.id})`);

  const pool2 = await prisma.pool.create({
    data: {
      name: 'Pool 2 - 24 Months',
      durationMonths: 24,
      takaraMultiplier: 1.5,
      usdtApy: 7.0,
      minInvestment: 100,
      targetAmount: 100000,
      currentAmount: 0,
      status: 'pending',
      isActive: true,
    },
  });
  console.log(`✅ Created: ${pool2.name} (ID: ${pool2.id})`);

  const pool3 = await prisma.pool.create({
    data: {
      name: 'Pool 3 - 36 Months',
      durationMonths: 36,
      takaraMultiplier: 2.0,
      usdtApy: 7.0,
      minInvestment: 100,
      targetAmount: 100000,
      currentAmount: 0,
      status: 'pending',
      isActive: true,
    },
  });
  console.log(`✅ Created: ${pool3.name} (ID: ${pool3.id})\n`);

  // ========================================
  // Создание настроек платформы
  // ========================================
  console.log('⚙️  Creating platform settings...');

  const settings = [
    {
      key: 'platform_wallet',
      value: '7rXW8Sjiz4u7dd1afhid1K7oQiSXghtEpop9zxLSjbha',
      description: 'Main platform Solana wallet for receiving deposits',
    },
    {
      key: 'takara_token_mint',
      value: '',
      description: 'TAKARA token mint address (will be set after token creation)',
    },
    {
      key: 'takara_token_decimals',
      value: '6',
      description: 'TAKARA token decimals',
    },
    {
      key: 'usdt_token_mint',
      value: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      description: 'USDT token mint address (Solana mainnet)',
    },
    {
      key: 'usdt_token_decimals',
      value: '6',
      description: 'USDT token decimals',
    },
    {
      key: 'min_withdrawal_usdt',
      value: '10',
      description: 'Minimum USDT withdrawal amount',
    },
    {
      key: 'min_withdrawal_takara',
      value: '100',
      description: 'Minimum TAKARA withdrawal amount',
    },
    {
      key: 'platform_fee_percentage',
      value: '0',
      description: 'Platform fee percentage on earnings (0 = no fee)',
    },
    {
      key: 'default_usdt_apy',
      value: '7.00',
      description: 'Default USDT APY for all pools',
    },
    {
      key: 'pool_activation_threshold',
      value: '100000',
      description: 'Minimum amount in USD to activate a pool',
    },
    {
      key: 'enable_investments',
      value: 'true',
      description: 'Enable/disable new investments globally',
    },
    {
      key: 'enable_withdrawals',
      value: 'true',
      description: 'Enable/disable withdrawal requests globally',
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode (disables all user operations)',
    },
  ];

  for (const setting of settings) {
    const created = await prisma.platformSetting.create({
      data: setting,
    });
    console.log(`✅ Created setting: ${created.key}`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Pools created: 3`);
  console.log(`   - Platform settings: ${settings.length}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Check Prisma Studio: npm run prisma:studio');
  console.log('   3. View the database at: http://localhost:5555\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
