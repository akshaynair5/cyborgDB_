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
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
    admissions: [],
  });

  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    console.log("➡️ Logged-in user:", user);
    fetchDashboardData();
  }, []);


  // ------------------------------------------------------------------
  // FETCH ALL DASHBOARD DATA
  // ------------------------------------------------------------------
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1) Overview (counts + recent items)
      const [summaryRes, overviewRes, analyticsRes, alertsRes, trendsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardOverview(),
        api.getDashboardAnalytics(),
        api.getDashboardAlerts(),
        api.getDashboardTrends(7),
      ]);

      // Basic summary (keeps backwards compat)
      const summary = summaryRes.data;
      setStats({
        patients: summary.counts.patients || 0,
        activeAdmissions: summary.counts.activeAdmissions || 0,
        encounters: summary.counts.encounters || 0,
        prescriptions: summary.counts.prescriptions || 0,
        labResults: summary.counts.labResults || 0,
        imagingReports: summary.counts.imagingReports || 0,
      });

      setRecentItems({
        patients: summary.recent.patients || [],
        admissions: summary.recent.admissions || [],
      });

      // Full overview (production-grade)
      setOverview(overviewRes.data);

      // Analytics
      setAnalytics(analyticsRes.data);

      // Alerts
      setAlerts(alertsRes.data);

      // Trends
      setStats((s) => ({ ...s, encountersTrend: trendsRes.data.series.encounters || [] }));
    } catch (error) {
      console.error("❌ Dashboard fetch failed:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // COMPONENTS
  // ------------------------------------------------------------------
  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className="mt-3">
              <div className="text-sm text-gray-500 mb-1">Last 7 days</div>
              <div className="flex items-end gap-1 h-6">
                {trend.map((v, i) => {
                  const max = Math.max(...trend, 1);
                  const h = Math.round((v / max) * 26) + 4; // px
                  return (
                    <div key={i} title={`${v}`} className={`w-2 rounded-sm bg-${color}-500`} style={{ height: `${h}px` }} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className={`bg-${color}-100 p-4 rounded-lg`}>
          <Icon className={`text-${color}-600`} size={32} />
        </div>
      </div>
    </div>
  );

  // ------------------------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold">{user?.firstName} {user?.lastName}</span>!
          </p>
          <button
            onClick={fetchDashboardData}
            className="text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-md"
          >
            Refresh
          </button>
          <div className="text-sm text-gray-400">Updated: {new Date().toLocaleString()}</div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Role: <span className="capitalize font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={Users} label="Total Patients" value={stats.patients} color="blue" />
        <StatCard icon={Activity} label="Active Admissions" value={stats.activeAdmissions} color="green" />
        <StatCard icon={BarChart3} label="Encounters" value={stats.encounters} color="purple" trend={stats.encountersTrend || []} />
        <StatCard icon={Pill} label="Prescriptions" value={stats.prescriptions} color="yellow" />
        <StatCard icon={TestTube} label="Lab Results" value={stats.labResults} color="pink" />
        <StatCard icon={ImageIcon} label="Imaging Reports" value={stats.imagingReports} color="indigo" />
      </div>

      {/* Analytics + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Diagnoses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-3">Top Diagnoses</h3>
          {analytics?.topDiagnoses?.length > 0 ? (
            <ul className="space-y-2">
              {analytics.topDiagnoses.map((d, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{d.description}</span>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{d.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No diagnosis data</p>
          )}
        </div>

        {/* Admissions by Ward */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-3">Admissions by Ward</h3>
          {analytics?.admissionsByWard?.length > 0 ? (
            <ul className="space-y-2">
              {analytics.admissionsByWard.map((w, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{w.ward}</span>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{w.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No admissions</p>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Alerts</h3>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <AlertTriangle size={16} /> <span>{alerts?.flaggedCount ?? 0} flagged labs</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Flagged lab results</p>
              {alerts?.flaggedRecent?.length > 0 ? (
                alerts.flaggedRecent.map((l) => (
                  <div key={l._id} className="text-sm text-gray-600 mt-2">
                    {l.patient ? `${l.patient}` : 'Patient'} — {l.reportedAt ? new Date(l.reportedAt).toLocaleDateString() : '—'}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">None</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Pending lab reports</p>
              {alerts?.pendingRecent?.length > 0 ? (
                alerts.pendingRecent.map((l) => (
                  <div key={l._id} className="text-sm text-gray-600 mt-2">
                    {l.patient ? `${l.patient}` : 'Patient'} — {l.collectedAt ? new Date(l.collectedAt).toLocaleDateString() : 'Collected: —'}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">None</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Items: Patients + Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Patients</h3>
            <button
              onClick={() => navigate('/patients')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {recentItems.patients.length > 0 ? (
              recentItems.patients.map((patient) => (
                <div
                  key={patient._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  onClick={() => navigate(`/patients/${patient._id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{patient.gender || 'N/A'}</p>
                  </div>

                  <p className="text-sm text-gray-600">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent patients</p>
            )}
          </div>
        </div>

        {/* Recent Admissions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Admissions</h3>
            <button
              onClick={() => navigate('/admissions')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {recentItems.admissions.length > 0 ? (
              recentItems.admissions.map((admission) => (
                <div
                  key={admission._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  onClick={() => navigate(`/admissions/${admission._id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Ward {admission.ward || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(admission.admittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      admission.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : admission.status === 'discharged'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {admission.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent admissions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
