import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const PrescriptionList = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    setFiltered(
      q
        ? rows.filter((r) => {
            const patientName = `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.toLowerCase();
            const mrn = r.patient?.hospitalId?.toLowerCase() || '';
            const medicine = r.medicineName.toLowerCase();

            return (
              patientName.includes(q) ||
              mrn.includes(q) ||
              medicine.includes(q)
            );
          })
        : rows
    );
  }, [search, rows]);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.getPrescriptions();

      const flattened = res.data.message.prescriptions.flatMap((p) =>
        p.items.map((item) => ({
          prescriptionId: p._id,
          patient: p.patient,
          prescribedBy: p.prescribedBy,
          notes: p.notes,
          createdAt: p.createdAt,
          fullPrescription: p,

          medicineName: item.name,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          instructions: item.instructions,
          quantity: item.quantity
        }))
      );

      setRows(flattened);
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

  const openModal = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
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
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, MRN or medicine..."
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Medicine</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Dosage</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Frequency</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {r.patient
                      ? `${r.patient.firstName} ${r.patient.lastName}`
                      : 'N/A'}
                  </td>

                  <td className="px-6 py-4">{r.medicineName}</td>
                  <td className="px-6 py-4 text-gray-500">{r.dosage}</td>
                  <td className="px-6 py-4 text-gray-500">{r.frequency}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 flex gap-3">
                    <button onClick={() => openModal(r.fullPrescription)} title="View">
                      <Eye size={18} className="text-blue-600" />
                    </button>

                    <button
                      onClick={() => navigate(`/prescriptions/${r.prescriptionId}/edit`)}
                      title="Edit"
                    >
                      <Edit size={18} className="text-green-600" />
                    </button>

                    <button
                      onClick={() => handleDelete(r.prescriptionId)}
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No prescriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && selectedPrescription && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-4">Prescription Details</h2>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Patient:</strong>{' '}
                {selectedPrescription.patient
                  ? `${selectedPrescription.patient.firstName} ${selectedPrescription.patient.lastName})`
                  : 'N/A'}
              </p>

              <p>
                <strong>Prescribed By:</strong>{' '}
                {selectedPrescription.prescribedBy
                  ? `${selectedPrescription.prescribedBy.firstName} ${selectedPrescription.prescribedBy.lastName}`
                  : 'N/A'}
              </p>

              <p>
                <strong>Date:</strong>{' '}
                {new Date(selectedPrescription.createdAt).toLocaleString()}
              </p>

              {selectedPrescription.notes && (
                <p><strong>Notes:</strong> {selectedPrescription.notes}</p>
              )}
            </div>

            <hr className="my-4" />

            <h3 className="font-semibold mb-2">Medicines</h3>

            <div className="space-y-3">
              {selectedPrescription.items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                  <p><strong>Name:</strong> {item.name}</p>
                  <p><strong>Dosage:</strong> {item.dosage}</p>
                  <p><strong>Frequency:</strong> {item.frequency}</p>
                  <p><strong>Duration:</strong> {item.durationDays} days</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Instructions:</strong> {item.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
