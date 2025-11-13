import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletContextProvider } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home/Home';
import Pools from './pages/Pools/Pools';
import Investments from './pages/Investments/Investments';
import Profile from './pages/Profile/Profile';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminWithdrawals from './pages/Admin/Withdrawals';
import AdminPools from './pages/Admin/PoolsManagement';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <AuthProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/pools" element={<Pools />} />
                  <Route path="/investments" element={<Investments />} />
                  <Route path="/profile" element={<Profile />} />
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                  <Route path="/admin/pools" element={<AdminPools />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </WalletContextProvider>
    </QueryClientProvider>
  );
};

export default App;
