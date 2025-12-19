import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  Bed,
  UserPlus,
  ClipboardList,
  HeartPulse,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const COLOR_CLASSES = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    bgMedium: 'bg-blue-100',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    gradient: 'from-blue-500 to-blue-600',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    bgMedium: 'bg-green-100',
    text: 'text-green-600',
    textDark: 'text-green-700',
    gradient: 'from-green-500 to-green-600',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    bgMedium: 'bg-purple-100',
    text: 'text-purple-600',
    textDark: 'text-purple-700',
    gradient: 'from-purple-500 to-purple-600',
  },
  yellow: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    bgMedium: 'bg-yellow-100',
    text: 'text-yellow-600',
    textDark: 'text-yellow-700',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  pink: {
    border: 'border-pink-500',
    bg: 'bg-pink-500',
    bgLight: 'bg-pink-50',
    bgMedium: 'bg-pink-100',
    text: 'text-pink-600',
    textDark: 'text-pink-700',
    gradient: 'from-pink-500 to-pink-600',
  },
  indigo: {
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    bgMedium: 'bg-indigo-100',
    text: 'text-indigo-600',
    textDark: 'text-indigo-700',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    bgMedium: 'bg-red-100',
    text: 'text-red-600',
    textDark: 'text-red-700',
    gradient: 'from-red-500 to-red-600',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    bgMedium: 'bg-orange-100',
    text: 'text-orange-600',
    textDark: 'text-orange-700',
    gradient: 'from-orange-500 to-orange-600',
  },
  teal: {
    border: 'border-teal-500',
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50',
    bgMedium: 'bg-teal-100',
    text: 'text-teal-600',
    textDark: 'text-teal-700',
    gradient: 'from-teal-500 to-teal-600',
  },
  gray: {
    border: 'border-gray-500',
    bg: 'bg-gray-500',
    bgLight: 'bg-gray-50',
    bgMedium: 'bg-gray-100',
    text: 'text-gray-600',
    textDark: 'text-gray-700',
    gradient: 'from-gray-500 to-gray-600',
  },
};

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800 border-green-200',
  discharged: 'bg-blue-100 text-blue-800 border-blue-200',
  transferred: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  stable: 'bg-green-100 text-green-800 border-green-200',
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return `${formatDate(date)} ${formatTime(date)}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous * 100).toFixed(1);
};



// ============================================================================
// SUBCOMPONENTS (Defined OUTSIDE Dashboard)
// ============================================================================

// 🎯 Skeleton Loader
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

const SkeletonList = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse flex items-center gap-4 p-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// 🎯 Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, trend, trendValue, onClick, subtitle }) => {
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  const isPositive = trendValue > 0;
  const isNegative = trendValue < 0;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 p-6
        hover:shadow-lg hover:border-gray-200 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        group
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value?.toLocaleString?.() || value}</p>
          
          {subtitle && (
            <p className="text-xs text-gray-400 mb-2">{subtitle}</p>
          )}

          {trendValue !== null && trendValue !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive && <TrendingUp size={14} className="text-green-500" />}
              {isNegative && <TrendingDown size={14} className="text-red-500" />}
              {!isPositive && !isNegative && <Activity size={14} className="text-gray-400" />}
              <span className={`text-xs font-medium ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
              }`}>
                {isPositive && '+'}{trendValue}% from last period
              </span>
            </div>
          )}

          {/* Mini Trend Chart */}
          {trend && trend.length > 0 && (
            <div className="mt-3 flex items-end gap-1 h-8">
              {trend.map((v, i) => {
                const max = Math.max(...trend, 1);
                const height = Math.max((v / max) * 100, 10);
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${colors.bg} opacity-60 hover:opacity-100 transition-opacity`}
                    style={{ height: `${height}%` }}
                    title={`Day ${i + 1}: ${v}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className={`${colors.bgMedium} p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={colors.text} size={28} />
        </div>
      </div>

      {onClick && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">View details</span>
          <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
};

// 🎯 Quick Action Button
const QuickActionButton = ({ icon: Icon, label, onClick, color = 'blue', badge }) => {
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-4 rounded-xl
        ${colors.bgLight} hover:shadow-md
        border-2 border-transparent hover:border-gray-200
        transition-all duration-200 group min-w-[100px]
      `}
    >
      {badge > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
      <div className={`${colors.bgMedium} p-3 rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
        <Icon className={colors.text} size={20} />
      </div>
      <span className={`text-xs font-medium ${colors.textDark}`}>{label}</span>
    </button>
  );
};

// 🎯 Alert Item Component
const AlertItem = ({ type, title, message, time, onClick }) => {
  const typeStyles = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertCircle, iconColor: 'text-yellow-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: AlertCircle, iconColor: 'text-blue-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-500' },
  };

  const style = typeStyles[type] || typeStyles.info;
  const IconComponent = style.icon;

  return (
    <div
      onClick={onClick}
      className={`
        ${style.bg} ${style.border} border rounded-xl p-4
        hover:shadow-md transition-all duration-200 cursor-pointer
      `}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`${style.iconColor} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{message}</p>
          {time && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Clock size={12} />
              {time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// 🎯 Recent Item Card
const RecentItemCard = ({ title, subtitle, meta, status, onClick, avatar }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
  >
    {avatar ? (
      <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
    ) : (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
        {title?.charAt(0)?.toUpperCase() || '?'}
      </div>
    )}
    
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-gray-900 truncate">{title}</h4>
      <p className="text-sm text-gray-500 truncate">{subtitle}</p>
    </div>

    <div className="flex flex-col items-end gap-1">
      {status && (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
          {status}
        </span>
      )}
      {meta && <span className="text-xs text-gray-400">{meta}</span>}
    </div>

    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
  </div>
);

// 🎯 Donut Chart Component
const DonutChart = ({ data, size = 120 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-gray-400 text-sm">No data</span>
      </div>
    );
  }

  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-gray-400 text-sm">No data</span>
      </div>
    );
  }

  let currentAngle = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        {data.map((item, i) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
          const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
          const endX = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const endY = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          
          const pathD = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
          
          currentAngle += angle;
          
          return (
            <path
              key={i}
              d={pathD}
              fill={item.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
            </path>
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-700">{total}</span>
      </div>
    </div>
  );
};

// 🎯 Activity Feed Component (MOVED OUTSIDE Dashboard)
const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      patient_registered: { icon: UserPlus, color: 'blue' },
      patient_admitted: { icon: Bed, color: 'green' },
      patient_discharged: { icon: CheckCircle, color: 'teal' },
      encounter_created: { icon: Stethoscope, color: 'purple' },
      prescription_created: { icon: Pill, color: 'yellow' },
      lab_result_added: { icon: TestTube, color: 'pink' },
      lab_result_flagged: { icon: AlertTriangle, color: 'red' },
      imaging_uploaded: { icon: ImageIcon, color: 'indigo' },
      default: { icon: Activity, color: 'gray' },
    };
    return icons[type] || icons.default;
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Activity size={48} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />

      <div className="space-y-4">
        {activities.slice(0, 10).map((activity, index) => {
          const { icon: Icon, color } = getActivityIcon(activity.type);
          const colors = COLOR_CLASSES[color] || COLOR_CLASSES.gray;

          return (
            <div key={activity._id || index} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full ${colors.bgMedium} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={colors.text} />
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title || activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(activity.timestamp || activity.createdAt)}
                  </span>
                </div>

                {activity.user && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white font-medium">
                      {activity.user?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500">{activity.user}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activities.length > 10 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  // State
  const [stats, setStats] = useState({
    patients: 0,
    activeAdmissions: 0,
    encounters: 0,
    prescriptions: 0,
    labResults: 0,
    imagingReports: 0,
    todayAppointments: 0,
    pendingLabResults: 0,
  });

  const [trends, setTrends] = useState({
    patients: [],
    encounters: [],
    admissions: [],
  });

  const [previousStats, setPreviousStats] = useState(null);

  const [recentItems, setRecentItems] = useState({
    patients: [],
    admissions: [],
    encounters: [],
    labResults: [],
  });

  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [dateRange, setDateRange] = useState('7d');

  // ========================================
  // DATA FETCHING
  // ========================================
  
  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const days = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

      const [summaryRes, overviewRes, analyticsRes, alertsRes, trendsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardOverview(),
        api.getDashboardAnalytics(),
        api.getDashboardAlerts(),
        api.getDashboardTrends(days),
      ]);

      // Summary
      const summary = summaryRes.data;
      setStats({
        patients: summary.counts?.patients || 0,
        activeAdmissions: summary.counts?.activeAdmissions || 0,
        encounters: summary.counts?.encounters || 0,
        prescriptions: summary.counts?.prescriptions || 0,
        labResults: summary.counts?.labResults || 0,
        imagingReports: summary.counts?.imagingReports || 0,
        todayAppointments: summary.counts?.todayAppointments || 0,
        pendingLabResults: summary.counts?.pendingLabResults || 0,
      });

      if (summary.previousPeriod) {
        setPreviousStats(summary.previousPeriod);
      }

      setRecentItems({
        patients: summary.recent?.patients || [],
        admissions: summary.recent?.admissions || [],
        encounters: summary.recent?.encounters || [],
        labResults: summary.recent?.labResults || [],
      });

      if (trendsRes.data?.series) {
        setTrends({
          patients: trendsRes.data.series.patients || [],
          encounters: trendsRes.data.series.encounters || [],
          admissions: trendsRes.data.series.admissions || [],
        });
      }

      setOverview(overviewRes.data);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data);
      setLastUpdated(new Date());
      
      if (showRefreshIndicator) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error("❌ Dashboard fetch failed:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const alertCount = useMemo(() => {
    return (alerts?.flaggedCount || 0) + (alerts?.pendingCount || 0);
  }, [alerts]);

  const patientTrendChange = useMemo(() => {
    if (!previousStats?.patients) return null;
    return calculatePercentageChange(stats.patients, previousStats.patients);
  }, [stats.patients, previousStats]);

  const admissionTrendChange = useMemo(() => {
    if (!previousStats?.activeAdmissions) return null;
    return calculatePercentageChange(stats.activeAdmissions, previousStats.activeAdmissions);
  }, [stats.activeAdmissions, previousStats]);

  const wardData = useMemo(() => {
    if (!analytics?.admissionsByWard) return [];
    return analytics.admissionsByWard.map((w, i) => ({
      label: w.ward?.substring(0, 3) || `W${i}`,
      value: w.count,
      fullLabel: w.ward,
    }));
  }, [analytics]);

  const statusDistribution = useMemo(() => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    if (!analytics?.statusDistribution) return [];
    return analytics.statusDistribution.map((s, i) => ({
      label: s.status,
      value: s.count,
      color: colors[i % colors.length],
    }));
  }, [analytics]);

  // ========================================
  // QUICK ACTIONS
  // ========================================

  const quickActions = useMemo(() => [
    { icon: UserPlus, label: 'New Patient', onClick: () => navigate('/patients/new'), color: 'blue' },
    { icon: Bed, label: 'New Admission', onClick: () => navigate('/admissions/new'), color: 'green' },
    { icon: Stethoscope, label: 'New Encounter', onClick: () => navigate('/encounters/new'), color: 'purple' },
    { icon: Pill, label: 'Prescription', onClick: () => navigate('/prescriptions/new'), color: 'yellow' },
    { icon: TestTube, label: 'Lab Result', onClick: () => navigate('/lab-results/new'), color: 'pink', badge: alerts?.pendingCount },
    { icon: ImageIcon, label: 'Imaging', onClick: () => navigate('/imaging-reports/new'), color: 'indigo' },
  ], [navigate, alerts?.pendingCount]);

  const filteredQuickActions = useMemo(() => {
    const roleActions = {
      admin: quickActions,
      doctor: quickActions,
      nurse: quickActions.filter(a => ['New Patient', 'New Admission', 'Lab Result'].includes(a.label)),
      lab_tech: quickActions.filter(a => ['Lab Result'].includes(a.label)),
      radiologist: quickActions.filter(a => ['Imaging'].includes(a.label)),
      receptionist: quickActions.filter(a => ['New Patient', 'New Admission'].includes(a.label)),
    };
    return roleActions[user?.role] || quickActions.slice(0, 3);
  }, [user?.role, quickActions]);

  // ========================================
  // EXPORT FUNCTION
  // ========================================

  const handleExport = async () => {
    try {
      toast.loading('Generating report...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reportData = {
        generatedAt: new Date().toISOString(),
        dateRange,
        stats,
        analytics,
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Report downloaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export report');
    }
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-5 bg-gray-200 rounded w-64"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <SkeletonList />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <SkeletonList />
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening at your hospital today.
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium capitalize">
              {user?.role || 'Staff'}
            </span>
            <span className="text-gray-400 flex items-center gap-1">
              <Clock size={14} />
              Last updated: {formatTime(lastUpdated)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {filteredQuickActions.map((action, i) => (
            <QuickActionButton key={i} {...action} />
          ))}
        </div>
      </div>

      {/* STATS CARDS - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.patients}
          color="blue"
          trend={trends.patients}
          trendValue={patientTrendChange}
          onClick={() => navigate('/patients')}
        />
        <StatCard
          icon={Bed}
          label="Active Admissions"
          value={stats.activeAdmissions}
          color="green"
          trend={trends.admissions}
          trendValue={admissionTrendChange}
          onClick={() => navigate('/admissions')}
        />
        <StatCard
          icon={Stethoscope}
          label="Encounters"
          value={stats.encounters}
          color="purple"
          trend={trends.encounters}
          onClick={() => navigate('/encounters')}
          subtitle="This period"
        />
        <StatCard
          icon={Pill}
          label="Prescriptions"
          value={stats.prescriptions}
          color="yellow"
          onClick={() => navigate('/prescriptions')}
        />
      </div>

      {/* STATS CARDS - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={TestTube}
          label="Lab Results"
          value={stats.labResults}
          color="pink"
          onClick={() => navigate('/lab-results')}
          subtitle={`${stats.pendingLabResults} pending`}
        />
        <StatCard
          icon={ImageIcon}
          label="Imaging Reports"
          value={stats.imagingReports}
          color="indigo"
          onClick={() => navigate('/imaging-reports')}
        />
        <StatCard
          icon={Calendar}
          label="Today's Appointments"
          value={stats.todayAppointments}
          color="teal"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={alertCount}
          color="red"
        />
      </div>

      {/* ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Diagnoses */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Top Diagnoses</h3>
            <span className="text-xs text-gray-400">{dateRange} period</span>
          </div>
          
          {analytics?.topDiagnoses?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topDiagnoses.slice(0, 5).map((d, i) => {
                const maxCount = Math.max(...analytics.topDiagnoses.map(x => x.count));
                const percentage = (d.count / maxCount) * 100;
                
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700 font-medium truncate flex-1 mr-2">
                        {d.description || d.code || 'Unknown'}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{d.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No diagnosis data available</p>
            </div>
          )}
        </div>

        {/* Admissions by Ward */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Admissions by Ward</h3>
            <Building2 size={20} className="text-gray-400" />
          </div>
          
          {wardData.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-32">
              {wardData.slice(0, 7).map((item, i) => {
                const max = Math.max(...wardData.map(w => w.value), 1);
                const height = Math.max((item.value / max) * 100, 5);
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-700">{item.value}</span>
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300 hover:from-green-600 hover:to-green-500"
                      style={{ height: `${height}%` }}
                      title={`${item.fullLabel}: ${item.value}`}
                    />
                    <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Bed size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No ward data available</p>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Status Distribution</h3>
            <Activity size={20} className="text-gray-400" />
          </div>
          
          {statusDistribution.length > 0 ? (
            <div className="flex items-center justify-center gap-6">
              <DonutChart data={statusDistribution} size={120} />
              <div className="space-y-2">
                {statusDistribution.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 capitalize">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No status data available</p>
            </div>
          )}
        </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">Alerts & Notifications</h3>
            {alertCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {alertCount}
              </span>
            )}
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts?.flaggedRecent?.slice(0, 2).map((lab, i) => (
            <AlertItem
              key={`flagged-${i}`}
              type="critical"
              title="Flagged Lab Result"
              message={`Patient: ${lab.patient?.firstName || ''} ${lab.patient?.lastName || ''} - Requires immediate attention`}
              time={formatDateTime(lab.reportedAt)}
              onClick={() => navigate(`/lab-results/${lab._id}`)}
            />
          ))}

          {alerts?.pendingRecent?.slice(0, 2).map((lab, i) => (
            <AlertItem
              key={`pending-${i}`}
              type="warning"
              title="Pending Lab Result"
              message={`Patient: ${lab.patient?.firstName || ''} ${lab.patient?.lastName || ''} - Awaiting results`}
              time={formatDateTime(lab.collectedAt)}
              onClick={() => navigate(`/lab-results/${lab._id}`)}
            />
          ))}

        </div>
      </div>

      {/* RECENT PATIENTS & ADMISSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Patients</h3>
            <button
              onClick={() => navigate('/patients')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentItems.patients.length > 0 ? (
              recentItems.patients.slice(0, 5).map((patient) => (
                <RecentItemCard
                  key={patient._id}
                  title={`${patient.firstName} ${patient.lastName}`}
                  subtitle={`${patient.gender || 'N/A'} • ${patient.age ? `${patient.age} years` : 'Age N/A'}`}
                  meta={formatDate(patient.createdAt)}
                  onClick={() => navigate(`/patients/${patient._id}`)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent patients</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Admissions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Admissions</h3>
            <button
              onClick={() => navigate('/admissions')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentItems.admissions.slice(0, 5).map((admission) => (
              <RecentItemCard
                key={admission._id}
                title={`${admission.patient?.firstName || ''} ${admission.patient?.lastName || ''}`}
                subtitle={`Ward ${admission.ward?.name || 'N/A'} • Room ${admission.room?.number || 'N/A'} • Bed ${admission.bed?.number || 'N/A'}`}
                meta={formatDate(admission.admittedAt)}
                status={admission.status}
                onClick={() => navigate(`/admissions/${admission._id}`)}
              />
            ))}

          </div>
        </div>
      </div>

      {/* RECENT ENCOUNTERS & LAB RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Encounters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Encounters</h3>
            <button
              onClick={() => navigate('/encounters')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentItems.encounters.slice(0, 5).map((encounter) => (
              <RecentItemCard
                key={encounter._id}
                title={`${encounter.patient?.firstName || ''} ${encounter.patient?.lastName || ''}`}
                subtitle={`${encounter.type || 'Consultation'} • Dr. ${encounter.provider?.firstName || ''} ${encounter.provider?.lastName || ''}`}
                meta={formatDate(encounter.date)}
                status={encounter.status}
                onClick={() => navigate(`/encounters/${encounter._id}/edit`)}
              />
            ))}

          </div>
        </div>

        {/* Recent Lab Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Lab Results</h3>
            <button
              onClick={() => navigate('/lab-results')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentItems.labResults.slice(0, 5).map((lab) => (
              <RecentItemCard
                key={lab._id}
                title={lab.testName || 'Lab Test'}
                subtitle={`Patient: ${lab.patient?.firstName || ''} ${lab.patient?.lastName || ''}`}
                meta={formatDate(lab.reportedAt || lab.collectedAt)}
                status={lab.status}
                onClick={() => navigate(`/lab-results/${lab._id}/edit`)}
              />
            ))}

          </div>
        </div>
      </div>

      {/* ACTIVITY FEED & HOSPITAL OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Activity Feed</h3>
            <span className="text-xs text-gray-400">Real-time updates</span>
          </div>
          <ActivityFeed activities={overview?.recentActivity || []} />
        </div>

        {/* Hospital Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Hospital Overview</h3>
            <HeartPulse size={20} className="text-red-400" />
          </div>

          <div className="space-y-4">
            {/* Bed Occupancy */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Bed Occupancy</span>
                <span className="text-sm font-bold text-gray-900">
                  {overview?.bedOccupancy?.occupied || 0}/{overview?.bedOccupancy?.total || 0}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (overview?.bedOccupancy?.percentage || 0) > 90
                      ? 'bg-red-500'
                      : (overview?.bedOccupancy?.percentage || 0) > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${overview?.bedOccupancy?.percentage || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {overview?.bedOccupancy?.percentage || 0}% occupied
              </p>
            </div>

            {/* Staff on Duty */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Staff on Duty</span>
                <span className="text-sm font-bold text-gray-900">
                  {overview?.staffOnDuty?.total || 0}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {overview?.staffOnDuty?.doctors || 0}
                  </p>
                  <p className="text-xs text-gray-500">Doctors</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {overview?.staffOnDuty?.nurses || 0}
                  </p>
                  <p className="text-xs text-gray-500">Nurses</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {overview?.staffOnDuty?.others || 0}
                  </p>
                  <p className="text-xs text-gray-500">Others</p>
                </div>
              </div>
            </div>

            {/* Emergency Cases */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500" />
                  <span className="text-sm font-medium text-red-700">Emergency Cases</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {overview?.emergencyCases || 0}
                </span>
              </div>
            </div>

            {/* Average Wait Time */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Avg. Wait Time</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {overview?.avgWaitTime || 0} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center py-4 text-sm text-gray-400">
        <p>Hospital Management System • Last updated: {formatDateTime(lastUpdated)}</p>
      </div>
    </div>
  );
};

export default Dashboard;