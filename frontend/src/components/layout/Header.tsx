import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { connected } = useWallet();
  const { isAuthenticated, login, logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleConnect = async () => {
    if (connected && !isAuthenticated) {
      try {
        await login();
      } catch (error) {
        console.error('Failed to authenticate:', error);
      }
    }
  };

  React.useEffect(() => {
    if (connected && !isAuthenticated) {
      handleConnect();
    }
  }, [connected]);

  return (
    <header className="bg-takara-green bg-opacity-50 backdrop-blur-md border-b border-takara-gold border-opacity-20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="text-4xl font-bold text-takara-gold group-hover:text-takara-gold-light transition-colors">
              宝
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Takara</h1>
              <p className="text-xs text-gray-400">DeFi Platform</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/')
                  ? 'text-takara-gold'
                  : 'text-gray-300 hover:text-takara-gold'
              }`}
            >
              Home
            </Link>
            <Link
              to="/pools"
              className={`font-medium transition-colors ${
                isActive('/pools')
                  ? 'text-takara-gold'
                  : 'text-gray-300 hover:text-takara-gold'
              }`}
            >
              Pools
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/investments"
                  className={`font-medium transition-colors ${
                    isActive('/investments')
                      ? 'text-takara-gold'
                      : 'text-gray-300 hover:text-takara-gold'
                  }`}
                >
                  My Investments
                </Link>
                <Link
                  to="/profile"
                  className={`font-medium transition-colors ${
                    isActive('/profile')
                      ? 'text-takara-gold'
                      : 'text-gray-300 hover:text-takara-gold'
                  }`}
                >
                  Profile
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`font-medium transition-colors ${
                      isActive('/admin')
                        ? 'text-takara-gold'
                        : 'text-gray-300 hover:text-takara-gold'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Wallet Button */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-takara-gold hover:!bg-takara-gold-light !text-takara-dark !font-semibold !rounded-lg !transition-all" />
            {isAuthenticated && (
              <button
                onClick={logout}
                className="text-gray-300 hover:text-red-400 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <nav className="md:hidden flex items-center justify-around mt-4 pt-4 border-t border-takara-gold border-opacity-20">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-takara-gold'
                  : 'text-gray-300 hover:text-takara-gold'
              }`}
            >
              Home
            </Link>
            <Link
              to="/pools"
              className={`text-sm font-medium transition-colors ${
                isActive('/pools')
                  ? 'text-takara-gold'
                  : 'text-gray-300 hover:text-takara-gold'
              }`}
            >
              Pools
            </Link>
            <Link
              to="/investments"
              className={`text-sm font-medium transition-colors ${
                isActive('/investments')
                  ? 'text-takara-gold'
                  : 'text-gray-300 hover:text-takara-gold'
              }`}
            >
              Investments
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors ${
                isActive('/profile')
                  ? 'text-takara-gold'
                  : 'text-gray-300 hover:text-takara-gold'
              }`}
            >
              Profile
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
