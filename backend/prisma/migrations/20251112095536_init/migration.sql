-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('pending', 'active', 'completed', 'withdrawn');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'processing', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal', 'reward_usdt', 'reward_takara', 'nft_mint');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'moderator', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(44) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "total_invested" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "total_takara_earned" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "total_usdt_earned" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "referral_code" VARCHAR(20),
    "referred_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "takara_multiplier" DECIMAL(4,2) NOT NULL,
    "usdt_apy" DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    "min_investment" DECIMAL(18,6) NOT NULL DEFAULT 100,
    "max_investment" DECIMAL(18,6),
    "target_amount" DECIMAL(18,6) NOT NULL DEFAULT 100000,
    "current_amount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "status" "PoolStatus" NOT NULL DEFAULT 'pending',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "takara_reward" DECIMAL(18,6) NOT NULL,
    "usdt_reward" DECIMAL(18,6) NOT NULL,
    "takara_claimed" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "usdt_claimed" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "nft_token_id" VARCHAR(100),
    "nft_metadata_uri" TEXT,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'pending',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_miners" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "token_address" VARCHAR(44) NOT NULL,
    "owner_wallet" VARCHAR(44) NOT NULL,
    "metadata_uri" TEXT NOT NULL,
    "image_uri" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "attributes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferred_at" TIMESTAMP(3),

    CONSTRAINT "nft_miners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "amount" DECIMAL(18,6) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "destination_wallet" VARCHAR(44) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'pending',
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "transaction_hash" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "investment_id" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "from_wallet" VARCHAR(44),
    "to_wallet" VARCHAR(44),
    "transaction_hash" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takara_earnings" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "daily_rate" DECIMAL(18,10) NOT NULL,
    "earned_date" DATE NOT NULL,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "takara_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usdt_earnings" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "daily_rate" DECIMAL(18,10) NOT NULL,
    "earned_date" DATE NOT NULL,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usdt_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "investments_nft_token_id_key" ON "investments"("nft_token_id");

-- CreateIndex
CREATE UNIQUE INDEX "nft_miners_investment_id_key" ON "nft_miners"("investment_id");

-- CreateIndex
CREATE UNIQUE INDEX "nft_miners_token_address_key" ON "nft_miners"("token_address");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_miners" ADD CONSTRAINT "nft_miners_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takara_earnings" ADD CONSTRAINT "takara_earnings_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usdt_earnings" ADD CONSTRAINT "usdt_earnings_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
