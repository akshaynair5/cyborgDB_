import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Eye, Edit, Trash2, Search, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EncounterList = () => {
  const navigate = useNavigate();
  const { user, setCurrentEncounter } = useApp();

  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchEncounters();
  }, []);

  useEffect(() => {
    const list = encounters.filter((e) => {
      return (
        search === '' ||
        e.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        e.encounterType?.toLowerCase().includes(search.toLowerCase())
      );
    });
    setFiltered(list);
  }, [search, encounters]);

  const fetchEncounters = async () => {
    try {
      const res = await api.getEncounters();
      const list = res?.data?.message?.encounters || res?.data?.encounters || res?.data || [];
      console.log("Encounters fetched:", list);
      setEncounters(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load encounters');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this encounter?')) return;
    try {
      await api.deleteEncounter(id);
      toast.success('Encounter deleted');
      fetchEncounters();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Encounters</h1>
        <button onClick={() => navigate('/encounters/new')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> New Encounter
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients or type..." className="w-full pl-10 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Seen By</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Started</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((e) => (
                  <tr key={e._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{e.patient.firstName +  ' ' + e.patient.lastName}</td>
                    <td className="px-6 py-4">{e.encounterType}</td>
                    <td className="px-6 py-4">{e.seenBy.firstName +  ' ' + e.seenBy.lastName} </td>
                    <td className="px-6 py-4">{e.startedAt ? new Date(e.startedAt).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => {
                          setCurrentEncounter(e);
                          navigate(`/encounters/${e._id}`, { state: { encounter: e } });
                        }} className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                        <button onClick={() => {
                          setCurrentEncounter(e);
                          navigate(`/encounters/${e._id}/edit`, { state: { encounter: e } });
                        }} className="text-green-600 hover:text-green-800"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(e._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-6 py-6 text-center text-gray-500">No encounters found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EncounterList;
