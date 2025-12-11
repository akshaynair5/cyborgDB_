import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Users,
  Activity,
  Pill,
  TestTube,
  ImageIcon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Fixed color mappings (Tailwind can't use dynamic classes)
const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    bgGradient: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-500',
    shadow: 'shadow-blue-500/25',
  },
  green: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    bgGradient: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    shadow: 'shadow-emerald-500/25',
  },
  purple: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    bgGradient: 'from-purple-500 to-indigo-600',
    text: 'text-purple-600',
    border: 'border-purple-500',
    shadow: 'shadow-purple-500/25',
  },
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    bgGradient: 'from-amber-500 to-orange-600',
    text: 'text-amber-600',
    border: 'border-amber-500',
    shadow: 'shadow-amber-500/25',
  },
  rose: {
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-50',
    bgGradient: 'from-rose-500 to-pink-600',
    text: 'text-rose-600',
    border: 'border-rose-500',
    shadow: 'shadow-rose-500/25',
  },
  indigo: {
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    bgGradient: 'from-indigo-500 to-violet-600',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    shadow: 'shadow-indigo-500/25',
  },
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [stats, setStats] = useState({
    patients: 0,
    activeAdmissions: 0,
    encounters: 0,
    prescriptions: 0,
    labResults: 0,
    imagingReports: 0,
  });
  const [recentItems, setRecentItems] = useState({
    patients: [],
    encounters: [],
    admissions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const patientsRes = await api.getPatients(user?.hospital || '');
      const admissionsRes = await api.getAdmissions(user?.hospital || '');

      setStats((prev) => ({
        ...prev,
        patients: patientsRes.data.length,
        activeAdmissions: admissionsRes.data.filter((a) => a.status === 'active').length,
      }));

      setRecentItems((prev) => ({
        ...prev,
        patients: patientsRes.data.slice(0, 5),
        admissions: admissionsRes.data.slice(0, 5),
      }));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    { icon: Users, label: 'Total Patients', key: 'patients', color: 'blue', trend: 12 },
    { icon: Activity, label: 'Active Admissions', key: 'activeAdmissions', color: 'green', trend: 8 },
    { icon: BarChart3, label: 'Encounters', key: 'encounters', color: 'purple', trend: -3 },
    { icon: Pill, label: 'Prescriptions', key: 'prescriptions', color: 'amber', trend: 15 },
    { icon: TestTube, label: 'Lab Results', key: 'labResults', color: 'rose', trend: 5 },
    { icon: ImageIcon, label: 'Imaging Reports', key: 'imagingReports', color: 'indigo', trend: 2 },
  ];

  const quickActions = [
    { label: 'New Patient', icon: Users, path: '/patients/new', color: 'blue', description: 'Register a new patient' },
    { label: 'Admit Patient', icon: Activity, path: '/admissions/new', color: 'green', description: 'Create new admission' },
    { label: 'New Encounter', icon: BarChart3, path: '/encounters/new', color: 'purple', description: 'Log patient encounter' },
    { label: 'Prescription', icon: Pill, path: '/prescriptions/new', color: 'amber', description: 'Write prescription' },
  ];

  // Stat Card Component
  const StatCard = ({ icon: Icon, label, value, color, trend }) => {
    const colors = colorClasses[color];
    const isPositive = trend >= 0;
    
    return (
      <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Gradient accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bgGradient}`} />
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-gray-500 text-sm font-medium">{label}</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-gray-900">{value}</p>
                {trend !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>{Math.abs(trend)}%</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">vs last month</p>
            </div>
            
            <div className={`${colors.bgLight} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={colors.text} size={28} />
            </div>
          </div>
        </div>
        
        {/* Hover effect gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      </div>
    );
  };

  // Quick Action Card
  const QuickActionCard = ({ icon: Icon, label, description, path, color }) => {
    const colors = colorClasses[color];
    
    return (
      <button
        onClick={() => navigate(path)}
        className="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 text-left overflow-hidden"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-300`} />
        
        <div className="relative z-10">
          <div className={`${colors.bgLight} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors duration-300`}>
            <Icon className={`${colors.text} group-hover:text-white transition-colors duration-300`} size={24} />
          </div>
          
          <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
            {label}
            <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </h3>
          <p className="text-sm text-gray-500 mt-1 group-hover:text-white/80 transition-colors duration-300">
            {description}
          </p>
        </div>
      </button>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" size={24} />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋
            </h1>
          </div>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</span>
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar size={14} />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus size={20} />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.key}
            icon={stat.icon}
            label={stat.label}
            value={stats[stat.key]}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            <p className="text-gray-400 mt-1">Common tasks and shortcuts</p>
          </div>
          <Sparkles className="text-yellow-400" size={24} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <QuickActionCard key={i} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Recent Patients</h3>
                  <p className="text-sm text-gray-500">Latest registrations</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/patients')}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium hover:gap-2 transition-all duration-200"
              >
                View All <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {recentItems.patients.length > 0 ? (
              recentItems.patients.map((patient, index) => (
                <div
                  key={patient._id}
                  onClick={() => navigate(`/patients/${patient._id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/20">
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">ID: {patient.hospitalId}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock size={14} />
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-auto mt-1" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">No recent patients</p>
                <button
                  onClick={() => navigate('/patients/new')}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Add your first patient →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Admissions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Activity className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Recent Admissions</h3>
                  <p className="text-sm text-gray-500">Current ward activity</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admissions')}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:gap-2 transition-all duration-200"
              >
                View All <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {recentItems.admissions.length > 0 ? (
              recentItems.admissions.map((admission, index) => (
                <div
                  key={admission._id}
                  onClick={() => navigate(`/admissions/${admission._id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/20">
                    W{admission.ward || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">Ward {admission.ward || 'N/A'}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(admission.admittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        admission.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20'
                          : admission.status === 'discharged'
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20'
                          : 'bg-amber-100 text-amber-700 ring-1 ring-amber-500/20'
                      }`}
                    >
                      {admission.status}
                    </span>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Activity className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">No recent admissions</p>
                <button
                  onClick={() => navigate('/admissions/new')}
                  className="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  Create first admission →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};