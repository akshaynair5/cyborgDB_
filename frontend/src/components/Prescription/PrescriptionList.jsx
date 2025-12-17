import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrescriptionList = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = rows.filter((p) => {
      return (
        q === '' ||
        p.patientName?.toLowerCase().includes(q) ||
        p.medication?.toLowerCase().includes(q) ||
        p.prescribedByName?.toLowerCase().includes(q)
      );
    });
    setFiltered(result);
  }, [search, rows]);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.getPrescriptions();

      let list =
        res?.data?.message?.prescriptions ||
        res?.data?.prescriptions ||
        [];

      const mappedList = list.map((p) => ({
        _id: p._id,
        patientName:
          p.patientName ||
          (p.patient?.firstName && p.patient?.lastName
            ? `${p.patient.firstName} ${p.patient.lastName}`
            : 'Unknown'),
        prescribedByName:
          p.prescribedByName ||
          (p.prescribedBy?.firstName && p.prescribedBy?.lastName
            ? `${p.prescribedBy.firstName} ${p.prescribedBy.lastName}`
            : '-'),
        medication:
          p.medication ||
          (p.items?.map((i) => i.name).join(', ') || '-'),
        dosage:
          p.dosage ||
          (p.items?.map((i) => i.dosage).join(', ') || '-'),
        frequency:
          p.frequency ||
          (p.items?.map((i) => i.frequency).join(', ') || '-'),
        createdAt: p.createdAt || null,
      }));

      setRows(mappedList);
      setFiltered(mappedList);
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

  const openModal = async (id) => {
    setSelectedId(id);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const res = await api.getPrescriptionById(id);
      const presc =
        res?.data?.message?.prescription ||
        res?.data?.prescription ||
        res?.data;
      setSelectedPrescription(presc);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch prescription');
    } finally {
      setModalLoading(false);
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
              <th className="px-6 py-3 text-left text-sm font-semibold">Medication</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Dosage</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Frequency</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Prescribed By</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{p.patientName}</td>
                  <td className="px-6 py-4">{p.medication}</td>
                  <td className="px-6 py-4">{p.dosage}</td>
                  <td className="px-6 py-4">{p.frequency}</td>
                  <td className="px-6 py-4">{p.prescribedByName}</td>
                  <td className="px-6 py-4">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
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
                <td colSpan="7" className="px-6 py-6 text-center text-gray-500">
                  No prescriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
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
                <h2 className="text-2xl font-bold mb-2">Prescription Details</h2>
                <div><strong>Patient:</strong> {selectedPrescription.patient?.firstName ? `${selectedPrescription.patient.firstName} ${selectedPrescription.patient.lastName}` : 'Unknown'}</div>
                <div><strong>Prescribed By:</strong> {selectedPrescription.prescribedBy?.firstName ? `${selectedPrescription.prescribedBy.firstName} ${selectedPrescription.prescribedBy.lastName}` : 'Unknown'}</div>
                <div><strong>Date:</strong> {selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleDateString() : '-'}</div>
                <div><strong>Notes:</strong> {selectedPrescription.notes || '-'}</div>

                {selectedPrescription.items?.length > 0 && (
                  <table className="w-full mt-2 border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Dosage</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Frequency</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Duration</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Instructions</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrescription.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2">{item.dosage}</td>
                          <td className="px-3 py-2">{item.frequency}</td>
                          <td className="px-3 py-2">{item.durationDays}</td>
                          <td className="px-3 py-2">{item.instructions}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
