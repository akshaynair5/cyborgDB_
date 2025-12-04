import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdmissionList = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  useEffect(() => {
    const filtered = admissions.filter((a) => {
      const matchesSearch = search === '' || a.patient.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || a.status === filter;
      return matchesSearch && matchesFilter;
    });
    setFiltered(filtered);
  }, [search, filter, admissions]);

  const fetchAdmissions = async () => {
    try {
      const response = await api.getAdmissions(user?.hospital || '');
      setAdmissions(response.data.message.admissions || []);
    } catch (error) {
      toast.error('Failed to fetch admissions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admissions</h1>
        <button
          onClick={() => navigate('/admissions/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> New Admission
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-4 border-b">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Admitted At</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ward</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((admission) => (
                  <tr key={admission._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{admission.patient}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(admission.admittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{admission.ward || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{admission.room || '-'}</td>
                    <td className="px-6 py-4 text-sm">
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
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admissions/${admission._id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>
                        {admission.status === 'active' && (
                          <>
                            <button
                              onClick={() => navigate(`/admissions/${admission._id}/edit`)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/admissions/${admission._id}/discharge`)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <LogOut size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No admissions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};