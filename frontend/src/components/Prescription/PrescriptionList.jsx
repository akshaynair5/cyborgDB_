import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrescriptionList = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const result = rows.filter((p) => {
      return (
        q === '' ||
        p.patientName?.toLowerCase().includes(q) ||
        p.medication?.toLowerCase().includes(q)
      );
    });

    setFiltered(result);
  }, [search, rows]);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.getPrescriptions();

      const list =
        res?.data?.message?.prescriptions ||
        res?.data?.prescriptions ||
        [];

      setRows(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prescription?')) return;

    try {
      await api.deletePrescription(id);
      toast.success('Prescription deleted');
      fetchPrescriptions();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-lg">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prescriptions</h1>

        <button
          onClick={() => navigate('/prescriptions/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2"
        >
          <Plus size={20} /> New Prescription
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient or medication..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Medication</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Dosage</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Frequency</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{p.patientName || 'Unknown'}</td>
                  <td className="px-6 py-4">{p.medication || '-'}</td>
                  <td className="px-6 py-4">{p.dosage || '-'}</td>
                  <td className="px-6 py-4">{p.frequency || '-'}</td>
                  <td className="px-6 py-4">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/prescriptions/${p._id}`)}
                        className="text-blue-600"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/prescriptions/${p._id}/edit`)}
                        className="text-green-600"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                  No prescriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrescriptionList;
