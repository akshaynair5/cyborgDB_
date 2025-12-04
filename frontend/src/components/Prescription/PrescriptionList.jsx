import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PrescriptionList = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    const filteredData = prescriptions.filter((p) =>
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.medication?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, prescriptions]);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.getPrescriptions();
      setPrescriptions(response.data.message.prescriptions || []);
    } catch (error) {
      toast.error('Failed to fetch prescriptions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    try {
      await api.deletePrescription(id);
      toast.success('Prescription deleted');
      fetchPrescriptions();
    } catch (error) {
      toast.error('Failed to delete prescription');
    }
  };

  if (loading) return <div className="text-center py-10 text-lg">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Prescriptions</h1>

        <button
          onClick={() => navigate('/prescriptions/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> New Prescription
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by patient or medication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Medication</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dosage</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Frequency</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((prescription) => (
                  <tr key={prescription._id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {prescription.patientName || 'Unknown'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {prescription.medication}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {prescription.dosage}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {prescription.frequency}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/prescriptions/${prescription._id}`)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/prescriptions/${prescription._id}/edit`)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(prescription._id)}
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
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No prescriptions found
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
