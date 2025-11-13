import { PrismaClient } from '@prisma/client';
import tokenService from './token.service.js';

const prisma = new PrismaClient();

/**
 * Rewards Service
 * Handles automatic calculation and distribution of daily rewards
 */
class RewardsService {
  constructor() {
    console.log('✅ Rewards Service initialized');
  }

  /**
   * Calculate daily USDT reward for an investment
   * @param {Object} investment - Investment record
   * @param {Object} pool - Pool record
   * @returns {number} Daily USDT reward amount
   */
  calculateDailyUSDTReward(investment, pool) {
    const amount = parseFloat(investment.amount);
    const dailyPercent = parseFloat(pool.dailyUsdtPercent);
    return (amount * dailyPercent) / 100;
  }

  /**
   * Process daily rewards for all active investments
   * This should be run once per day via cron job
   */
  async processDailyRewards() {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🎁 Starting Daily Rewards Processing');
      console.log('='.repeat(60));
      console.log('Time:', new Date().toISOString());

      // Get all active investments
      const activeInvestments = await prisma.investment.findMany({
        where: {
          status: 'active',
        },
        include: {
          pool: true,
          user: true,
        },
      });

      console.log(`\n📊 Found ${activeInvestments.length} active investments to process`);

      if (activeInvestments.length === 0) {
        console.log('✅ No active investments to process');
        return {
          success: true,
          processedCount: 0,
          totalUSDT: 0,
          totalTAKARA: 0,
        };
      }

      let processedCount = 0;
      let totalUSDT = 0;
      let totalTAKARA = 0;
      const errors = [];

      // Process each investment
      for (const investment of activeInvestments) {
        try {
          console.log(`\n💎 Processing investment ${investment.id.substring(0, 8)}...`);
          console.log(`   User: ${investment.user.walletAddress.substring(0, 8)}...`);
          console.log(`   Pool: ${investment.pool.name}`);
          console.log(`   Amount: ${investment.amount} USDT`);

          // Calculate daily USDT reward
          const dailyUSDT = this.calculateDailyUSDTReward(investment, investment.pool);
          console.log(`   Daily USDT: ${dailyUSDT.toFixed(2)}`);

          // Create USDT earning record
          await prisma.usdtEarning.create({
            data: {
              investmentId: investment.id,
              amount: dailyUSDT,
              status: 'pending', // Will be 'claimed' when user claims
              earnedAt: new Date(),
            },
          });

          // Update investment total USDT reward
          await prisma.investment.update({
            where: { id: investment.id },
            data: {
              usdtReward: {
                increment: dailyUSDT,
              },
            },
          });

          totalUSDT += dailyUSDT;
          console.log(`   ✅ USDT reward recorded: ${dailyUSDT.toFixed(2)} USDT`);

          // Calculate and distribute TAKARA rewards (daily portion)
          // Total TAKARA reward is distributed over the pool duration
          const totalTakaraReward = parseFloat(investment.takaraReward);
          const durationDays = investment.pool.durationMonths * 30; // Approximate days
          const dailyTakara = totalTakaraReward / durationDays;

          console.log(`   Daily TAKARA: ${dailyTakara.toFixed(2)}`);

          // Only distribute if TAKARA token is configured
          if (tokenService.takaraTokenMint) {
            try {
              // Send TAKARA tokens to user
              const takaraResult = await tokenService.sendTakaraReward(
                investment.user.walletAddress,
                dailyTakara
              );

              // Create TAKARA earning record
              await prisma.takaraEarning.create({
                data: {
                  investmentId: investment.id,
                  amount: dailyTakara,
                  txSignature: takaraResult.signature,
                  status: 'distributed',
                  earnedAt: new Date(),
                },
              });

              // Update investment total TAKARA distributed
              await prisma.investment.update({
                where: { id: investment.id },
                data: {
                  takaraDistributed: {
                    increment: dailyTakara,
                  },
                },
              });

              totalTAKARA += dailyTakara;
              console.log(`   ✅ TAKARA distributed: ${dailyTakara.toFixed(2)} TAKARA`);
              console.log(`   TX: ${takaraResult.signature.substring(0, 16)}...`);

            } catch (takaraError) {
              console.error(`   ⚠️  Failed to distribute TAKARA:`, takaraError.message);

              // Still create earning record but mark as failed
              await prisma.takaraEarning.create({
                data: {
                  investmentId: investment.id,
                  amount: dailyTakara,
                  status: 'failed',
                  earnedAt: new Date(),
                },
              });

              errors.push({
                investmentId: investment.id,
                error: `TAKARA distribution failed: ${takaraError.message}`,
              });
            }
          } else {
            console.log('   ⚠️  TAKARA token not configured, skipping distribution');
          }

          processedCount++;

        } catch (error) {
          console.error(`   ❌ Error processing investment ${investment.id}:`, error);
          errors.push({
            investmentId: investment.id,
            error: error.message,
          });
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('🎉 Daily Rewards Processing Complete!');
      console.log('='.repeat(60));
      console.log(`✅ Processed: ${processedCount}/${activeInvestments.length} investments`);
      console.log(`💰 Total USDT Rewards: ${totalUSDT.toFixed(2)} USDT`);
      console.log(`🪙  Total TAKARA Distributed: ${totalTAKARA.toFixed(2)} TAKARA`);

      if (errors.length > 0) {
        console.log(`⚠️  Errors: ${errors.length}`);
        errors.forEach(err => {
          console.log(`   - ${err.investmentId}: ${err.error}`);
        });
      }

      return {
        success: true,
        processedCount,
        totalInvestments: activeInvestments.length,
        totalUSDT,
        totalTAKARA,
        errors,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('\n❌ Fatal error in daily rewards processing:', error);
      throw error;
    }
  }

  /**
   * Get rewards summary for a specific date
   * @param {Date} date - Date to get summary for
   * @returns {Promise<Object>} Rewards summary
   */
  async getRewardsSummary(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [usdtEarnings, takaraEarnings] = await Promise.all([
      prisma.usdtEarning.findMany({
        where: {
          earnedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.takaraEarning.findMany({
        where: {
          earnedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    const totalUSDT = usdtEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalTAKARA = takaraEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return {
      date: date.toISOString().split('T')[0],
      usdtEarnings: {
        count: usdtEarnings.length,
        total: totalUSDT,
      },
      takaraEarnings: {
        count: takaraEarnings.length,
        total: totalTAKARA,
        distributed: takaraEarnings.filter(e => e.status === 'distributed').length,
        failed: takaraEarnings.filter(e => e.status === 'failed').length,
      },
    };
  }

  /**
   * Manual trigger for testing (admin only)
   * Processes rewards with optional dry-run mode
   */
  async testRewardsProcessing(dryRun = true) {
    console.log(`\n🧪 Test Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

    if (dryRun) {
      console.log('⚠️  This is a simulation - no actual rewards will be distributed\n');

      // Get active investments for simulation
      const activeInvestments = await prisma.investment.findMany({
        where: { status: 'active' },
        include: { pool: true, user: true },
      });

      console.log(`Found ${activeInvestments.length} active investments`);

      for (const inv of activeInvestments.slice(0, 3)) { // Show first 3
        const dailyUSDT = this.calculateDailyUSDTReward(inv, inv.pool);
        const totalTakara = parseFloat(inv.takaraReward);
        const dailyTakara = totalTakara / (inv.pool.durationMonths * 30);

        console.log(`\nInvestment ${inv.id.substring(0, 8)}:`);
        console.log(`  User: ${inv.user.walletAddress.substring(0, 12)}...`);
        console.log(`  Would receive: ${dailyUSDT.toFixed(2)} USDT`);
        console.log(`  Would receive: ${dailyTakara.toFixed(2)} TAKARA`);
      }

      return { dryRun: true, message: 'Simulation complete' };
    } else {
      return await this.processDailyRewards();
    }
  }
}

// Export singleton instance
const rewardsService = new RewardsService();
export default rewardsService;
