import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-takara-green bg-opacity-50 backdrop-blur-md border-t border-takara-gold border-opacity-20 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl font-bold text-takara-gold">宝</div>
              <div>
                <h3 className="text-xl font-bold gradient-text">Takara</h3>
                <p className="text-xs text-gray-400">DeFi Platform</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Secure DeFi investment platform on Solana blockchain. Earn TAKARA tokens and USDT rewards through strategic staking.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-takara-gold font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/pools" className="text-gray-400 hover:text-takara-gold transition-colors">
                  Investment Pools
                </a>
              </li>
              <li>
                <a href="/investments" className="text-gray-400 hover:text-takara-gold transition-colors">
                  My Investments
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-400 hover:text-takara-gold transition-colors">
                  Profile
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Info */}
          <div>
            <h4 className="text-takara-gold font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <span className="text-takara-gold">⚡</span>
                <span>Built on Solana</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-takara-gold">🔒</span>
                <span>Secured by Phantom Wallet</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-takara-gold">💎</span>
                <span>NFT Wexel Miners</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-takara-gold">📈</span>
                <span>7% USDT APY</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-takara-gold border-opacity-20">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2024 Takara DeFi Platform. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-takara-gold transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-takara-gold transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-takara-gold transition-colors">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
