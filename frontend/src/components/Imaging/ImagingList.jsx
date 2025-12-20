import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';

/* =====================================================
   COMPONENT
===================================================== */
export const ImagingList = () => {
  const navigate = useNavigate();

  const [imaging, setImaging] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedImaging, setSelectedImaging] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* =====================================================
     NORMALIZER (API → UI SHAPE)
     Backend is source of truth
  ===================================================== */
  const normalizeImaging = (rows = []) =>
    rows.map((r) => ({
      _id: r._id,

      patientName: r.patientName || null,

      modality: r.modality,
      report: r.report,
      performedAt: r.performedAt,
      reportedAt: r.reportedAt,

      images: r.images || [],
      createdAt: r.createdAt,
    }));

  /* =====================================================
     FETCH
  ===================================================== */
  const fetchImaging = async () => {
    try {
      const res = await api.getImagingReports();

      const raw =
        res?.data?.imagingReports ||
        res?.data?.message?.imagingReports ||
        [];

      const normalized = normalizeImaging(raw);
      setImaging(normalized);
      setFiltered(normalized);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch imaging records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImaging();
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */
  useEffect(() => {
    const q = search.toLowerCase();

    if (!q) {
      setFiltered(imaging);
      return;
    }

    setFiltered(
      imaging.filter((i) => {
        const patientName = i.patientName.toLowerCase();

        return (
          patientName.includes(q) ||
          (i.modality || '').toLowerCase().includes(q)
        );
      })
    );
  }, [search, imaging]);

  /* =====================================================
     ACTIONS
  ===================================================== */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this imaging record?')) return;

    try {
      await api.deleteImagingReport(id);
      toast.success('Imaging record deleted');
      fetchImaging();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete imaging record');
    }
  };

  const openModal = (record) => {
    setSelectedImaging(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedImaging(null);
    setIsModalOpen(false);
  };

  /* =====================================================
     RENDER
  ===================================================== */
  if (loading) {
    return <div className="text-center py-10 text-lg">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Imaging Records</h1>

        <button
          onClick={() => navigate('/imaging-reports/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex gap-2"
        >
          <Plus size={20} /> New Imaging
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or modality..."
            className="pl-10 w-full py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Modality</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Report</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Performed</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {item.patientName
                      ? item.patientName
                      : 'N/A'}
                  </td>

                  <td className="px-6 py-4">{item.modality}</td>

                  <td className="px-6 py-4 text-gray-500 truncate max-w-xs">
                    {item.report || '—'}
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {item.performedAt
                      ? new Date(item.performedAt).toLocaleDateString()
                      : '—'}
                  </td>

                  <td className="px-6 py-4 flex gap-3">
                    <button onClick={() => openModal(item)} title="View">
                      <Eye size={18} className="text-blue-600" />
                    </button>

                    <button
                      onClick={() => navigate(`/imaging-reports/${item._id}/edit`)}
                      title="Edit"
                    >
                      <Edit size={18} className="text-green-600" />
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No imaging records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && selectedImaging && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-4">Imaging Report</h2>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Patient:</strong>{' '}
                {selectedImaging.patientName
                  ? selectedImaging.patientName
                  : 'N/A'}
              </p>

              <p><strong>Modality:</strong> {selectedImaging.modality}</p>

              <p>
                <strong>Performed At:</strong>{' '}
                {new Date(selectedImaging.performedAt).toLocaleString()}
              </p>

              <p>
                <strong>Reported At:</strong>{' '}
                {selectedImaging.reportedAt
                  ? new Date(selectedImaging.reportedAt).toLocaleString()
                  : '—'}
              </p>
            </div>

            <hr className="my-4" />

            <div>
              <h3 className="font-semibold mb-2">Report</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {selectedImaging.report || 'No report available.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
