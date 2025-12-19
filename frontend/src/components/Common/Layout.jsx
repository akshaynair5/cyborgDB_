import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
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
  Bell,
  Search,
  ChevronLeft,
  Activity,
} from 'lucide-react';

/* ================= ROLE ACCESS CONFIG ================= */
const ROLE_ACCESS = {
  doctor: [
    '/dashboard',
    '/patients',
    '/encounters',
    '/search',
    '/admissions',
    '/prescriptions',
    '/lab-results',
    '/imaging-reports',
  ],
  nurse: [
    '/dashboard',
    '/patients',
    '/encounters',
    '/search',
    '/lab-results',
    '/imaging-reports',
  ],
  staff: [
    '/dashboard',
    '/patients',
    '/search',
    '/admissions',
  ],
};

/* ================= ALL MENU ITEMS ================= */
const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: Activity, label: 'Encounters', path: '/encounters' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: TrendingUp, label: 'Admissions', path: '/admissions' },
  { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
  { icon: TestTube, label: 'Lab Results', path: '/lab-results' },
  { icon: Image, label: 'Imaging', path: '/imaging-reports' },
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  /* ================= ROUTE PROTECTION ================= */
  useEffect(() => {
    if (!user) return;

    const allowed = ROLE_ACCESS[user.role] || [];
    const isAllowed = allowed.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith(path + '/')
    );

    if (!isAllowed) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, user, navigate]);

  /* ================= FILTER MENU BY ROLE ================= */
  const allowedPaths = ROLE_ACCESS[user?.role] || [];
  const menuItems = ALL_MENU_ITEMS.filter(item =>
    allowedPaths.some(p => item.path.startsWith(p))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 fixed h-full left-0 top-0 z-40 hidden md:flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity size={22} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold">HealthCare</h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronLeft
              size={20}
              className={`${!sidebarOpen && 'rotate-180'} transition-transform`}
            />
          </button>
        </div>

        {/* User */}
        {sidebarOpen && (
          <div className="p-4 mx-4 mt-4 bg-slate-700 rounded-xl">
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs capitalize text-slate-400">{user?.role}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="mt-6 px-3 space-y-1 flex-1 overflow-y-auto no-scrollbar">
          {menuItems.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <item.icon size={15} />
                {sidebarOpen && item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-1 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/20 text-slate-300"
          >
            <LogOut size={15} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR ================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 md:hidden transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform`}
      >
        <nav className="mt-6 px-3 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-700"
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main
        className={`${
          sidebarOpen ? 'md:ml-72' : 'md:ml-20'
        } flex-1 flex flex-col`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex justify-between items-center">
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <Bell size={20} />
            <span className="text-sm font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
