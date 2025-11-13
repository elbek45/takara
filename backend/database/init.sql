-- Takara DeFi Platform - Database Initialization Script
-- PostgreSQL 16

-- Create database if not exists (run as superuser)
-- CREATE DATABASE takara_db;

-- Create user if not exists
-- CREATE USER takara WITH PASSWORD 'takara_password';

-- Grant privileges
-- GRANT ALL PRIVILEGES ON DATABASE takara_db TO takara;

-- Connect to takara_db database before running below commands

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE pool_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE investment_status AS ENUM ('pending', 'active', 'completed', 'withdrawn');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'reward_usdt', 'reward_takara', 'nft_mint');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    total_invested DECIMAL(18, 6) DEFAULT 0 NOT NULL,
    total_takara_earned DECIMAL(18, 6) DEFAULT 0 NOT NULL,
    total_usdt_earned DECIMAL(18, 6) DEFAULT 0 NOT NULL,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP
);

-- Pools table
CREATE TABLE pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL,
    takara_multiplier DECIMAL(4, 2) NOT NULL, -- 1.0, 1.5, 2.0
    usdt_apy DECIMAL(5, 2) DEFAULT 7.00 NOT NULL, -- 7% APY
    min_investment DECIMAL(18, 6) DEFAULT 100 NOT NULL,
    max_investment DECIMAL(18, 6),
    target_amount DECIMAL(18, 6) DEFAULT 100000 NOT NULL, -- $100k minimum
    current_amount DECIMAL(18, 6) DEFAULT 0 NOT NULL,
    status pool_status DEFAULT 'pending' NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Investments table
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE RESTRICT,
    amount DECIMAL(18, 6) NOT NULL,
    takara_reward DECIMAL(18, 6) NOT NULL, -- calculated based on pool multiplier
    usdt_reward DECIMAL(18, 6) NOT NULL, -- calculated based on APY
    takara_claimed DECIMAL(18, 6) DEFAULT 0 NOT NULL,
    usdt_claimed DECIMAL(18, 6) DEFAULT 0 NOT NULL,
    nft_token_id VARCHAR(100) UNIQUE, -- Solana NFT mint address
    nft_metadata_uri TEXT,
    status investment_status DEFAULT 'pending' NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- NFT Miners (Wexel NFT) table
CREATE TABLE nft_miners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID UNIQUE NOT NULL REFERENCES investments(id) ON DELETE RESTRICT,
    token_address VARCHAR(44) UNIQUE NOT NULL, -- Solana NFT mint address
    owner_wallet VARCHAR(44) NOT NULL, -- Current owner (can be transferred)
    metadata_uri TEXT NOT NULL,
    image_uri TEXT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    attributes JSONB, -- NFT attributes as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    transferred_at TIMESTAMP
);

-- Withdrawal requests table
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
    amount DECIMAL(18, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- 'USDT' or 'TAKARA'
    destination_wallet VARCHAR(44) NOT NULL,
    status withdrawal_status DEFAULT 'pending' NOT NULL,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    rejection_reason TEXT,
    transaction_hash VARCHAR(100), -- Solana transaction signature
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Transactions history table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(18, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- 'USDT', 'TAKARA', 'SOL'
    from_wallet VARCHAR(44),
    to_wallet VARCHAR(44),
    transaction_hash VARCHAR(100), -- Solana transaction signature
    metadata JSONB, -- Additional transaction data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- TAKARA earnings tracking table
CREATE TABLE takara_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    amount DECIMAL(18, 6) NOT NULL,
    daily_rate DECIMAL(18, 10) NOT NULL, -- Daily earning rate
    earned_date DATE NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE NOT NULL,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- USDT earnings tracking table
CREATE TABLE usdt_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    amount DECIMAL(18, 6) NOT NULL,
    daily_rate DECIMAL(18, 10) NOT NULL, -- Daily earning rate (7% APY)
    earned_date DATE NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE NOT NULL,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Platform settings table
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_referral ON users(referral_code);
CREATE INDEX idx_pools_status ON pools(status);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_pool ON investments(pool_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_nft_miners_owner ON nft_miners(owner_wallet);
CREATE INDEX idx_nft_miners_token ON nft_miners(token_address);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_takara_earnings_investment ON takara_earnings(investment_id);
CREATE INDEX idx_takara_earnings_date ON takara_earnings(earned_date);
CREATE INDEX idx_usdt_earnings_investment ON usdt_earnings(investment_id);
CREATE INDEX idx_usdt_earnings_date ON usdt_earnings(earned_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pools_updated_at BEFORE UPDATE ON pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default pools
INSERT INTO pools (name, duration_months, takara_multiplier, usdt_apy, target_amount) VALUES
('Pool 1 - 12 Months', 12, 1.00, 7.00, 100000),
('Pool 2 - 24 Months', 24, 1.50, 7.00, 100000),
('Pool 3 - 36 Months', 36, 2.00, 7.00, 100000);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('platform_wallet', '7rXW8Sjiz4u7dd1afhid1K7oQiSXghtEpop9zxLSjbha', 'Main platform Solana wallet for receiving deposits'),
('takara_token_decimals', '6', 'TAKARA token decimals'),
('min_withdrawal_usdt', '10', 'Minimum USDT withdrawal amount'),
('min_withdrawal_takara', '100', 'Minimum TAKARA withdrawal amount'),
('platform_fee_percentage', '0', 'Platform fee percentage on earnings');

-- Grant permissions to takara user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO takara;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO takara;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO takara;

COMMENT ON DATABASE takara_db IS 'Takara DeFi Platform - Main Database';
