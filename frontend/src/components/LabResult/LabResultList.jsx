import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LabResultList = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchLabResults();
  }, []);

  useEffect(() => {
    const filteredData = results.filter((item) =>
      item.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      item.testName?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, results]);

  const fetchLabResults = async () => {
    try {
      const response = await api.getLabResults();
      setResults(response.data.message.labResults || []);
    } catch (error) {
      toast.error('Failed to fetch lab results');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lab result?')) return;
    try {
      await api.deleteLabResult(id);
      toast.success('Lab result deleted');
      fetchLabResults();
    } catch (error) {
      toast.error('Failed to delete lab result');
    }
  };

  if (loading) return <div className="text-center py-10 text-lg">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Lab Results</h1>

        <button
          onClick={() => navigate('/lab-results/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> New Lab Result
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by patient name or test name..."
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Test Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Result</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {item.patientName || 'Unknown'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.testName}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.resultValue || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/lab-results/${item._id}`)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => navigate(`/lab-results/${item._id}/edit`)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(item._id)}
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
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No lab results found
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