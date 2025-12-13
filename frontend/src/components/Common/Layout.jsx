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

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const debounceRef = useRef(null);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Activity, label: 'Encounters', path: '/encounters' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: TrendingUp, label: 'Admissions', path: '/admissions' },
    { icon: Pill, label: 'Prescriptions', path: '/prescriptions' },
    { icon: TestTube, label: 'Lab Results', path: '/lab-results' },
    { icon: Image, label: 'Imaging', path: '/imaging-reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out fixed h-full left-0 top-0 z-40 hidden md:flex md:flex-col shadow-2xl`}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Activity size={22} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  HealthCare
                </h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-700/50 p-2 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft 
              size={20} 
              className={`transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* User Profile Mini */}
        {sidebarOpen && (
          <div className="p-4 mx-4 mt-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1 flex-1 overflow-y-auto">
          <p className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ${sidebarOpen ? 'px-4' : 'text-center'}`}>
            {sidebarOpen ? 'Main Menu' : '•••'}
          </p>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                  }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
                <item.icon size={20} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {sidebarOpen && (
                  <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">
                    {item.label}
                  </span>
                )}
                {!sidebarOpen && active && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all duration-200 text-slate-300 hover:text-red-400 group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity size={22} />
            </div>
            <h1 className="text-xl font-bold">HealthCare</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Nav */}
        <nav className="mt-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'hover:bg-slate-700/50 text-slate-300'
                  }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`${
          sidebarOpen ? 'md:ml-72' : 'md:ml-20'
        } flex-1 overflow-auto transition-all duration-300 flex flex-col min-h-screen`}
      >
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-200/50">
          <div className="px-4 md:px-6 py-4 flex justify-between items-center">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <Menu size={24} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/profile')} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Activity size={18} className="text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-800">HMS</h1>
                </button>
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <div className="relative">
                  <input
                    type="text"
                    value={headerSearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHeaderSearch(v);
                      // debounce suggestions
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      if (!v || v.trim().length === 0) {
                        setSuggestions([]);
                        return;
                      }
                      debounceRef.current = setTimeout(async () => {
                        setSugLoading(true);
                        try {
                          const res = await api.localSearch(v.trim(), 5);
                          const body = res?.data?.data?.results || res?.data?.results || res?.data || [];
                          setSuggestions(body.slice(0,5));
                        } catch (err) {
                          console.error('typeahead fetch failed', err?.response?.data || err.message);
                          setSuggestions([]);
                        } finally {
                          setSugLoading(false);
                        }
                      }, 250);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && headerSearch.trim().length > 0) {
                        // navigate to local search page
                        navigate(`/search/local?query=${encodeURIComponent(headerSearch.trim())}`);
                      }
                    }}
                    placeholder="Search patients, records..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                  />

                  {/* Suggestions dropdown */}
                  {suggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-50 max-h-64 overflow-auto">
                      {suggestions.map((s, idx) => (
                        <button
                          key={`${s.type}-${s.id}-${idx}`}
                          onClick={() => {
                            setSuggestions([]);
                            setHeaderSearch('');
                            if (s.type === 'patient') navigate(`/patients/${s.id}`);
                            else if (s.type === 'encounter') navigate(`/encounters/${s.id}`);
                            else if (s.type === 'lab') navigate(`/lab-results/${s.id}`);
                            else if (s.type === 'imaging') navigate(`/imaging-reports/${s.id}`);
                            else navigate(`/search/local?query=${encodeURIComponent(s.title || '')}`);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-800">{s.title}</div>
                            <div className="text-xs text-gray-500">{s.type} • {String(s.hospital_id)}</div>
                          </div>
                          <div className="text-xs text-gray-400">Open</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Notifications */}
              <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <Bell size={20} className="text-gray-600 group-hover:text-gray-900" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>

              {/* User Profile - Desktop */}
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
                <button onClick={() => navigate('/profile')} className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;