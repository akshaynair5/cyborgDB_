import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';

/* =====================================================
   COMPONENT
===================================================== */
export const LabResultList = () => {
  const navigate = useNavigate();

  const [labs, setLabs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* =====================================================
     NORMALIZER (API → UI SHAPE)
  ===================================================== */
  const normalizeLabs = (rows = []) =>
    rows.map((r) => ({
      _id: r._id,

      patient: {
        // Replace later with populated patient data if available
        firstName: r.patient?.firstName || 'Patient',
        lastName: r.patient?.lastName || 'Unknown',
      },

      status: r.status || 'reported',
      collectedAt: r.collectedAt,
      reportedAt: r.reportedAt,

      tests: (r.tests || []).map((t) => ({
        testName: t.testName,
        value: t.value,
        units: t.units,
        referenceRange: t.referenceRange,
        flagged: t.flagged,
        status: t.status,
      })),
    }));

  /* =====================================================
     FETCH
  ===================================================== */
  const fetchLabs = async () => {
    try {
      const res = await api.getLabResults();
      console.log('Lab results fetched:', res?.data);

      const raw =
        res?.data?.labResults ||
        res?.data?.message?.labResults ||
        [];

      const normalized = normalizeLabs(raw);
      setLabs(normalized);
      setFiltered(normalized);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch lab results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */
  useEffect(() => {
    const q = search.toLowerCase();

    if (!q) {
      setFiltered(labs);
      return;
    }

    setFiltered(
      labs.filter((lab) => {
        const patientName =
          `${lab.patient.firstName} ${lab.patient.lastName}`.toLowerCase();

        const hasMatchingTest = lab.tests.some((t) =>
          t.testName.toLowerCase().includes(q)
        );

        return patientName.includes(q) || hasMatchingTest;
      })
    );
  }, [search, labs]);

  /* =====================================================
     ACTIONS
  ===================================================== */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lab record?')) return;

    try {
      await api.deleteLabResult(id);
      toast.success('Lab record deleted');
      fetchLabs();
    } catch {
      toast.error('Failed to delete lab record');
    }
  };

  const openModal = (lab, test) => {
    setSelectedLab(lab);
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLab(null);
    setSelectedTest(null);
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
        <h1 className="text-3xl font-bold text-gray-800">Lab Results</h1>

        <button
          onClick={() => navigate('/lab-results/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> New Lab Result
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or test name..."
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Test</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Result</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Reported</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.flatMap((lab) =>
                lab.tests.map((test, idx) => (
                  <tr key={`${lab._id}-${idx}`} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {`${lab.patient.firstName} ${lab.patient.lastName}`}
                    </td>

                    <td className="px-6 py-4">{test.testName}</td>

                    <td className="px-6 py-4 text-gray-700">
                      {test.value} {test.units}
                      {test.flagged && (
                        <span className="ml-2 text-red-500 font-semibold">
                          ⚠
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 capitalize text-gray-500">
                      {test.status || lab.status}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {lab.reportedAt
                        ? new Date(lab.reportedAt).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => openModal(lab, test)} title="View">
                        <Eye size={18} className="text-blue-600" />
                      </button>

                      <button
                        onClick={() => navigate(`/lab-results/${lab._id}/edit`)}
                        title="Edit"
                      >
                        <Edit size={18} className="text-green-600" />
                      </button>

                      <button
                        onClick={() => handleDelete(lab._id)}
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No lab results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && selectedLab && selectedTest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-4">Lab Result Details</h2>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Patient:</strong>{' '}
                {`${selectedLab.patient.firstName} ${selectedLab.patient.lastName}`}
              </p>

              <p><strong>Test:</strong> {selectedTest.testName}</p>
              <p><strong>Status:</strong> {selectedTest.status}</p>

              <p>
                <strong>Collected At:</strong>{' '}
                {new Date(selectedLab.collectedAt).toLocaleString()}
              </p>

              <p>
                <strong>Reported At:</strong>{' '}
                {new Date(selectedLab.reportedAt).toLocaleString()}
              </p>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <p><strong>Value:</strong> {selectedTest.value} {selectedTest.units}</p>
              <p><strong>Reference Range:</strong> {selectedTest.referenceRange}</p>

              {selectedTest.flagged && (
                <p className="text-red-600 font-semibold">
                  ⚠ Abnormal Result
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};