import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/pools', label: 'Pools' },
    { path: '/withdrawals', label: 'Withdrawals' },
    { path: '/users', label: 'Users' },
  ];

  return (
    <header className="bg-takara-green bg-opacity-40 backdrop-blur-sm border-b border-takara-gold border-opacity-20 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">TAKARA</span>
            <span className="text-sm text-gray-400 hidden sm:inline">Admin Panel</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.path
                    ? 'bg-takara-gold text-takara-dark'
                    : 'text-gray-300 hover:bg-takara-green hover:bg-opacity-60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-8 h-8 bg-takara-gold bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-takara-gold font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-300">{user.username}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
