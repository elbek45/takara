import cron from 'node-cron';
import rewardsService from './rewards.service.js';

/**
 * Cron Service
 * Manages scheduled tasks for the platform
 */
class CronService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Initialize and start all cron jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Cron service already running');
      return;
    }

    const enabled = process.env.ENABLE_CRON_JOBS === 'true';

    if (!enabled) {
      console.log('⚠️  Cron jobs disabled in environment');
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('⏰ Starting Cron Service');
    console.log('='.repeat(60));

    // Daily Rewards Job
    // Runs every day at midnight (00:00)
    // Cron format: second minute hour day month dayOfWeek
    const dailyRewardsCron = process.env.DAILY_REWARDS_CRON || '0 0 * * *';

    const dailyRewardsJob = cron.schedule(
      dailyRewardsCron,
      async () => {
        console.log('\n⏰ Triggered: Daily Rewards Cron Job');
        try {
          const result = await rewardsService.processDailyRewards();
          console.log('✅ Daily rewards job completed successfully');
          console.log(`   Processed: ${result.processedCount} investments`);
          console.log(`   Total USDT: ${result.totalUSDT.toFixed(2)}`);
          console.log(`   Total TAKARA: ${result.totalTAKARA.toFixed(2)}`);
        } catch (error) {
          console.error('❌ Daily rewards job failed:', error);
          // TODO: Send alert email to admin
        }
      },
      {
        scheduled: true,
        timezone: process.env.TZ || 'UTC',
      }
    );

    this.jobs.push({
      name: 'Daily Rewards',
      schedule: dailyRewardsCron,
      job: dailyRewardsJob,
    });

    console.log('✅ Daily Rewards Job scheduled');
    console.log(`   Schedule: ${dailyRewardsCron}`);
    console.log(`   Timezone: ${process.env.TZ || 'UTC'}`);
    console.log(`   Next run: ${this.getNextRun(dailyRewardsCron)}`);

    // Pool Completion Check Job
    // Runs every day at 1:00 AM
    const poolCheckJob = cron.schedule(
      '0 1 * * *',
      async () => {
        console.log('\n⏰ Triggered: Pool Completion Check Job');
        try {
          await this.checkAndCompleteExpiredPools();
        } catch (error) {
          console.error('❌ Pool completion check failed:', error);
        }
      },
      {
        scheduled: true,
        timezone: process.env.TZ || 'UTC',
      }
    );

    this.jobs.push({
      name: 'Pool Completion Check',
      schedule: '0 1 * * *',
      job: poolCheckJob,
    });

    console.log('✅ Pool Completion Check Job scheduled');
    console.log('   Schedule: 0 1 * * * (Daily at 1:00 AM)');

    // Health Check Job
    // Runs every 5 minutes
    const healthCheckJob = cron.schedule(
      '*/5 * * * *',
      () => {
        this.healthCheck();
      },
      {
        scheduled: true,
        timezone: process.env.TZ || 'UTC',
      }
    );

    this.jobs.push({
      name: 'Health Check',
      schedule: '*/5 * * * *',
      job: healthCheckJob,
    });

    console.log('✅ Health Check Job scheduled');
    console.log('   Schedule: */5 * * * * (Every 5 minutes)');

    console.log('\n📊 Active Cron Jobs: ' + this.jobs.length);
    console.log('='.repeat(60) + '\n');

    this.isRunning = true;
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    console.log('⏸️  Stopping cron service...');

    for (const jobInfo of this.jobs) {
      jobInfo.job.stop();
      console.log(`   Stopped: ${jobInfo.name}`);
    }

    this.jobs = [];
    this.isRunning = false;

    console.log('✅ Cron service stopped');
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: this.jobs.map(j => ({
        name: j.name,
        schedule: j.schedule,
        nextRun: this.getNextRun(j.schedule),
      })),
    };
  }

  /**
   * Get next run time for a cron schedule
   */
  getNextRun(cronSchedule) {
    try {
      // Simple approximation - for production use a proper cron parser
      const now = new Date();
      // Just return a placeholder
      return 'Check cron schedule format';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Check and automatically complete expired pools
   */
  async checkAndCompleteExpiredPools() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const now = new Date();

      // Find active pools that have passed their end date
      const expiredPools = await prisma.pool.findMany({
        where: {
          status: 'active',
          endDate: {
            lte: now,
          },
        },
      });

      console.log(`   Found ${expiredPools.length} expired pools`);

      for (const pool of expiredPools) {
        console.log(`   Completing pool: ${pool.name}`);

        await prisma.pool.update({
          where: { id: pool.id },
          data: { status: 'completed' },
        });

        // Mark all investments in this pool as completed
        await prisma.investment.updateMany({
          where: {
            poolId: pool.id,
            status: 'active',
          },
          data: {
            status: 'completed',
            completedAt: now,
          },
        });

        console.log(`   ✅ Pool ${pool.name} completed`);
      }

    } catch (error) {
      console.error('Error checking expired pools:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Simple health check
   */
  healthCheck() {
    const status = this.getStatus();
    // Could log to monitoring service
    // console.log('🏥 Health check - all jobs running:', status.isRunning);
  }

  /**
   * Manually trigger daily rewards (for testing)
   */
  async triggerDailyRewards() {
    console.log('🔧 Manually triggering daily rewards...');
    return await rewardsService.processDailyRewards();
  }
}

// Export singleton instance
const cronService = new CronService();
export default cronService;
