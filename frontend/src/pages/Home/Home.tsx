import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { poolsService } from '../../services/api';

const Home: React.FC = () => {
  const { data: poolsData } = useQuery({
    queryKey: ['pools'],
    queryFn: () => poolsService.getAll(),
  });

  const pools = poolsData?.data || [];
  const activePools = pools.filter(p => p.status === 'active').length;
  const totalInvested = pools.reduce((sum, p) => sum + parseFloat(p.currentAmount || '0'), 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Japanese Symbol */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-takara-gold text-opacity-5 text-[20rem] md:text-[30rem] font-bold pointer-events-none select-none">
          宝
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Takara DeFi</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Unlock the treasure of blockchain investing.<br />
              Earn <span className="text-takara-gold font-semibold">TAKARA tokens</span> and <span className="text-takara-gold font-semibold">7% USDT APY</span> through strategic staking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pools" className="btn-primary text-lg px-8 py-4">
                Explore Pools
              </Link>
              <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-takara-green bg-opacity-30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                {activePools}
              </div>
              <p className="text-gray-400">Active Pools</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                ${totalInvested.toLocaleString()}
              </div>
              <p className="text-gray-400">Total Invested</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                7%
              </div>
              <p className="text-gray-400">USDT APY</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="card text-center">
              <div className="text-6xl mb-4">👛</div>
              <h3 className="text-2xl font-bold text-takara-gold mb-3">Connect Wallet</h3>
              <p className="text-gray-400">
                Connect your Phantom wallet to authenticate securely on the Solana blockchain.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card text-center">
              <div className="text-6xl mb-4">💎</div>
              <h3 className="text-2xl font-bold text-takara-gold mb-3">Choose Pool</h3>
              <p className="text-gray-400">
                Select from 12, 24, or 36-month pools with different TAKARA multipliers (1x, 1.5x, 2x).
              </p>
            </div>

            {/* Step 3 */}
            <div className="card text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-2xl font-bold text-takara-gold mb-3">Earn Rewards</h3>
              <p className="text-gray-400">
                Receive an NFT Wexel miner and earn TAKARA tokens + 7% USDT APY throughout your investment period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-takara-green bg-opacity-30">
        <div className="container mx-auto px-4">
          <h2 className="section-title text-center">Platform Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <h3 className="text-xl font-bold text-takara-gold mb-2">Solana Powered</h3>
                  <p className="text-gray-400">
                    Built on Solana for fast, secure, and low-cost transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🎨</div>
                <div>
                  <h3 className="text-xl font-bold text-takara-gold mb-2">NFT Wexel Miners</h3>
                  <p className="text-gray-400">
                    Each investment creates a unique NFT miner that represents your stake.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">💰</div>
                <div>
                  <h3 className="text-xl font-bold text-takara-gold mb-2">Dual Rewards</h3>
                  <p className="text-gray-400">
                    Earn both TAKARA tokens and 7% USDT APY on all investments.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🔒</div>
                <div>
                  <h3 className="text-xl font-bold text-takara-gold mb-2">Secure & Transparent</h3>
                  <p className="text-gray-400">
                    Smart contract-based with full transparency and security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="card max-w-4xl mx-auto text-center shimmer">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the Takara DeFi platform today and unlock your investment potential.
            </p>
            <Link to="/pools" className="btn-primary text-lg px-12 py-4 inline-block">
              View Investment Pools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
