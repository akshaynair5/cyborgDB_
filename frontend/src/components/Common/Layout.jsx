import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Pill,
  TestTube,
  Image,
  Settings,
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: TrendingUp, label: 'Admissions', path: '/admissions' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: TestTube, label: 'Lab Results', path: '/lab-results' },
    { icon: Image, label: 'Imaging', path: '/imaging-reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 fixed h-full left-0 top-0 z-40 hidden md:block`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              HMS
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-gray-700 p-2 rounded transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-700 transition duration-200 group"
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="group-hover:translate-x-1 transition">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-red-600 transition text-left"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        } flex-1 overflow-auto transition-all duration-300 flex flex-col`}
      >
        {/* Top Bar */}
        <div className="bg-white shadow sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800">HMS</h1>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="flex md:hidden">
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-gray-50 border-t p-4">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-200 transition text-left"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;