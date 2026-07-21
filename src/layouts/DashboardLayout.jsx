import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import { 
  LayoutDashboard, 
  Layers, 
  Send, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Search,
  CheckCircle2
} from 'lucide-react';

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { namespace, setNamespace, namespaces, searchQuery, setSearchQuery } = useDashboard();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pods', path: '/pods', icon: Layers },
    { name: 'Deployments', path: '/deployments', icon: Send },
    { name: 'Nodes', path: '/nodes', icon: Cpu },
    { name: 'Services', path: '/services', icon: Globe },
    { name: 'RBAC', path: '/rbac', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-k8s-bg flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-k8s-blue text-white shadow-md z-30 sticky top-0 flex items-center justify-between px-4 py-3 h-16 relative">
        {/* Left Side (Mobile Menu) */}
        <div className="flex items-center z-10">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 mr-2 text-white hover:bg-blue-600 rounded transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Link to="/" className="flex items-center select-none pointer-events-auto">
            <svg className="w-8 h-8 mr-2.5 text-white" viewBox="0 0 256 250" fill="currentColor">
              <path d="M128 0L23.7 34.3l15.9 123.4 88.4 92.3 88.4-92.3 15.9-123.4L128 0zm0 30l81.6 26.8-12.4 96.6-69.2 72.3-69.2-72.3-12.4-96.6L128 30z"/>
            </svg>
            <span className="font-bold text-lg tracking-wider hidden sm:inline">KUBERNETES</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4 z-10">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600/60 hover:bg-blue-600/90 border border-blue-300/30 transition-colors focus:outline-none"
            >
              <User className="w-5 h-5 text-white" />
            </button>

            {profileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded border border-gray-200 shadow-lg py-1 z-50 text-gray-800">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.username || 'Guest'}</p>
                    <p className="text-xs text-gray-500 font-mono">{user?.role || 'User'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-row relative">
        
        {/* Mobile Sidebar overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-16 bottom-0 left-0 w-60 bg-white border-r border-gray-200 z-35 transition-transform duration-300 ease-in-out md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full justify-between py-4">
            
            {/* Nav links */}
            <nav className="px-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center px-4 py-2.5 rounded text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-k8s-lightBlue text-k8s-blue border-l-4 border-k8s-blue pl-3 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-k8s-blue' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout button at bottom of sidebar */}
            <div className="px-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 rounded text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3 text-red-400" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 md:pl-60 min-w-0 flex flex-col p-6">
          {/* Mobile search bar */}
          <div className="mb-4 block md:hidden relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-k8s-blue transition-all"
            />
          </div>

          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
