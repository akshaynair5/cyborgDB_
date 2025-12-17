import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Eye,
  Edit,
  LogOut,
  BedDouble,
  X
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export const AdmissionList = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const [admissions, setAdmissions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");

  // Discharge state
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [dischargeSummary, setDischargeSummary] = useState("");

  /* =====================================================
     LOAD
  ===================================================== */
  const loadAdmissions = async () => {
    try {
      const res = await api.getAdmissions(user?.hospital);
      console.log("Admissions fetched:", res?.data);
      setAdmissions(res.data.message.admissions || []);
    } catch {
      toast.error("Unable to load admissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  /* =====================================================
     FILTER
  ===================================================== */
  useEffect(() => {
    const list = admissions.filter((a) => {
      const searchMatch =
        !search ||
        a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.hospitalId?.toLowerCase().includes(search.toLowerCase());

      const filterMatch = filter === "all" || a.status === filter;
      return searchMatch && filterMatch;
    });

    setFiltered(list);
  }, [search, filter, admissions]);

  /* =====================================================
     DISCHARGE
  ===================================================== */
  const handleDischarge = async () => {
    try {
      await api.dischargePatient(selectedAdmission._id, {
        dischargeSummary,
      });

      toast.success("Patient discharged successfully");
      setShowDischargeModal(false);
      setSelectedAdmission(null);
      setDischargeSummary("");
      loadAdmissions();
    } catch (err) {
      console.log(err)
      toast.error(
        err?.response?.data?.message || "Failed to discharge patient"
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-600 animate-pulse">
        Loading admissions...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BedDouble size={30} className="text-blue-600" />
          Admissions
        </h1>

        <button
          onClick={() => navigate("/admissions/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> New Admission
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6 border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by patient name or Hospital ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto border">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Hospital ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Admitted</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Ward</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Room</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length ? (
              filtered.map((a) => (
                <tr key={a._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{a.patientName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {a.hospitalId || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(a.admittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{a.ward || "-"}</td>
                  <td className="px-6 py-4">{a.room || "-"}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        a.status === "active"
                          ? "bg-green-100 text-green-700"
                          : a.status === "discharged"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/admissions/${a._id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={18} />
                      </button>

                      {a.status === "active" && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/admissions/${a._id}/edit`)
                            }
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAdmission(a);
                              setShowDischargeModal(true);
                            }}
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
                <td colSpan="7" className="text-center py-10 text-gray-500">
                  No admissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= DISCHARGE MODAL ================= */}
      {showDischargeModal && selectedAdmission && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowDischargeModal(false)}
              className="absolute top-4 right-4 text-gray-500"
            >
              <X />
            </button>

            <h2 className="text-xl font-bold mb-3">Discharge Patient</h2>

            <p className="text-sm text-gray-600 mb-3">
              Patient: <strong>{selectedAdmission.patientName}</strong>
            </p>

            <textarea
              value={dischargeSummary}
              onChange={(e) => setDischargeSummary(e.target.value)}
              placeholder="Discharge summary / instructions..."
              className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDischargeModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={handleDischarge}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
              >
                Confirm Discharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};