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

      // ------------ PATIENTS ------------
      const patientsRes = await api.getPatients();
      console.log("📌 Patients fetched:", patientsRes.data);

      // ------------ ADMISSIONS ------------
      const admissionsRes = await api.getAdmissions();
      console.log("📌 Admissions fetched:", admissionsRes.data);

      // ------------ ENCOUNTERS ------------
      const encountersRes = await api.getEncounters();
      console.log("📌 Encounters fetched:", encountersRes.data);

      // ------------ PRESCRIPTIONS ------------
      const prescriptionsRes = await api.getPrescriptions();
      console.log("📌 Prescriptions fetched:", prescriptionsRes.data);

      // ------------ LAB RESULTS ------------
      const labRes = await api.getLabResults();
      console.log("📌 Lab results fetched:", labRes.data);

      // ------------ IMAGING REPORTS ------------
      const imagingRes = await api.getImagingReports();
      console.log("📌 Imaging reports fetched:", imagingRes.data);

      // ------------ UPDATE STATS ------------
      setStats({
        patients: patientsRes.data.length || 0,
        activeAdmissions: admissionsRes.data.length || 0,
        encounters: encountersRes.data.length || 0,
        prescriptions: prescriptionsRes.data.length || 0,
        labResults: labRes.data.length || 0,
        imagingReports: imagingRes.data.length || 0,
      });

      // ------------ UPDATE RECENT ITEMS ------------
      setRecentItems({
        patients: patientsRes.data || [],
        admissions: admissionsRes.data || [],
      });
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
            <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
              <TrendingUp size={16} /> {trend}% increase
            </p>
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
        <p className="text-gray-600 mt-2">
          Welcome back,{" "}
          <span className="font-semibold">
            {user?.firstName} {user?.lastName}
          </span>
          !
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Role: <span className="capitalize font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={Users} label="Total Patients" value={stats.patients} color="blue" trend={12} />
        <StatCard icon={Activity} label="Active Admissions" value={stats.activeAdmissions} color="green" />
        <StatCard icon={BarChart3} label="Encounters" value={stats.encounters} color="purple" />
        <StatCard icon={Pill} label="Prescriptions" value={stats.prescriptions} color="yellow" />
        <StatCard icon={TestTube} label="Lab Results" value={stats.labResults} color="pink" />
        <StatCard icon={ImageIcon} label="Imaging Reports" value={stats.imagingReports} color="indigo" />
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
