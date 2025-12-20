import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* =====================================================
   COMPONENT
===================================================== */
export const PrescriptionList = () => {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  /* =====================================================
     NORMALIZER (API → UI SHAPE)
  ===================================================== */
  const normalizePrescriptions = (rows = []) =>
    rows.map((p) => ({
      _id: p._id,

      patient: p.patient
        ? {
            _id: p.patient._id,
            firstName: p.patient.firstName,
            lastName: p.patient.lastName,
          }
        : null,

      prescribedBy: p.prescribedBy
        ? {
            _id: p.prescribedBy._id,
            firstName: p.prescribedBy.firstName,
            lastName: p.prescribedBy.lastName,
          }
        : null,

      items: p.items || [],
      encounter: p.encounter,
      createdAt: p.createdAt,
    }));

  /* =====================================================
     FETCH
  ===================================================== */
  const fetchPrescriptions = async () => {
    try {
      const res = await api.getPrescriptions();
      console.log('Prescriptions fetched:', res?.data);

      const raw =
        res?.data?.prescriptions ||
        res?.data?.message?.prescriptions ||
        [];

      const normalized = normalizePrescriptions(raw);
      setPrescriptions(normalized);
      setFiltered(normalized);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  /* =====================================================
     SEARCH
  ===================================================== */
  useEffect(() => {
    const q = search.toLowerCase();

    if (!q) {
      setFiltered(prescriptions);
      return;
    }

    setFiltered(
      prescriptions.filter((p) => {
        const patientName =
          `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.toLowerCase();

        const prescriberName =
          `${p.prescribedBy?.firstName || ''} ${p.prescribedBy?.lastName || ''}`.toLowerCase();

        const meds = p.items
          .map((i) => i.name.toLowerCase())
          .join(' ');

        return (
          patientName.includes(q) ||
          prescriberName.includes(q) ||
          meds.includes(q)
        );
      })
    );
  }, [search, prescriptions]);

  /* =====================================================
     ACTIONS
  ===================================================== */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prescription?')) return;

    try {
      await api.deletePrescription(id);
      toast.success('Prescription deleted');
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const openModal = async (id) => {
    setModalOpen(true);
    setModalLoading(true);

    try {
      const res = await api.getPrescriptionById(id);
      const presc =
        res?.data?.prescription ||
        res?.data?.message?.prescription ||
        res?.data;

      setSelectedPrescription(presc);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch prescription');
    } finally {
      setModalLoading(false);
    }
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
            placeholder="Search by patient, medication, or prescriber..."
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Medications</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Prescribed By</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {p.patient
                      ? `${p.patient.firstName} ${p.patient.lastName}`
                      : 'Unknown'}
                  </td>

                  <td className="px-6 py-4">
                    {p.items.map((i) => i.name).join(', ')}
                  </td>

                  <td className="px-6 py-4">
                    {p.prescribedBy
                      ? `${p.prescribedBy.firstName} ${p.prescribedBy.lastName}`
                      : '-'}
                  </td>

                  <td className="px-6 py-4">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : '-'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openModal(p._id)}
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
                <td colSpan="5" className="px-6 py-6 text-center text-gray-500">
                  No prescriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
            >
              <X size={24} />
            </button>

            {modalLoading ? (
              <div className="text-center py-10">Loading...</div>
            ) : selectedPrescription ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Prescription Details</h2>

                <p>
                  <strong>Patient:</strong>{' '}
                  {selectedPrescription.patient
                    ? `${selectedPrescription.patient.firstName} ${selectedPrescription.patient.lastName}`
                    : 'Unknown'}
                </p>

                <p>
                  <strong>Prescribed By:</strong>{' '}
                  {selectedPrescription.prescribedBy
                    ? `${selectedPrescription.prescribedBy.firstName} ${selectedPrescription.prescribedBy.lastName}`
                    : 'Unknown'}
                </p>

                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                </p>

                <table className="w-full mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm">Medicine</th>
                      <th className="px-3 py-2 text-left text-sm">Dosage</th>
                      <th className="px-3 py-2 text-left text-sm">Frequency</th>
                      <th className="px-3 py-2 text-left text-sm">Duration</th>
                      <th className="px-3 py-2 text-left text-sm">Instructions</th>
                      <th className="px-3 py-2 text-left text-sm">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrescription.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.dosage}</td>
                        <td className="px-3 py-2">{item.frequency}</td>
                        <td className="px-3 py-2">{item.durationDays} days</td>
                        <td className="px-3 py-2">{item.instructions}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">No data</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};