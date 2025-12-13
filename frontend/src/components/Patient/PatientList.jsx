import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PatientList = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(
      (p) =>
        p.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        p.hospitalId.includes(search)
    );
    setFiltered(filtered);
  }, [search, patients]);

  const fetchPatients = async () => {
    try {
      const response = await api.getPatients(user?.hospital || '');
      setPatients(response.data.message.patients || []);
    } catch (error) {
      toast.error('Failed to fetch patients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await api.deletePatient(id);
      toast.success('Patient deleted');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  if (loading) return <div className="text-center py-10 text-lg">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
        <button
          onClick={() => navigate('/patients/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> New Patient
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or MRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">MRN</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">DOB</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Blood Group</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((patient) => (
                  <tr key={patient._id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{patient.hospitalId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(patient.dob).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{patient.gender}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{patient.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{patient.bloodGroup || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/patients/${patient._id}`)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${patient._id}/edit`)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No patients found
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