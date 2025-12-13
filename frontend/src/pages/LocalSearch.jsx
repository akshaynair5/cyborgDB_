import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

export const LocalSearch = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('query') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (q && q.length > 0) doSearch(q);
  }, [q]);

  const doSearch = async (term) => {
    setLoading(true);
    try {
      const res = await api.localSearch(term, 50);
      const body = res?.data?.data?.results || res?.data?.results || res?.data || [];
      setResults(body);
    } catch (err) {
      console.error('Local search failed', err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || 'Local search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Local Search (Patients & Records)</h1>
      <p className="text-sm text-gray-500 mb-4">Searching within your hospital only: <strong>{user?.hospital || 'unknown'}</strong></p>

      {!q && <p className="text-gray-500">Enter a query in the header search and press Enter.</p>}

      {loading && <p className="text-gray-500">Searching...</p>}

      {Array.isArray(results) && results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`} className="p-3 bg-white rounded border flex justify-between items-start">
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-gray-500">Type: {r.type} • Hospital: {String(r.hospital_id)}</div>
                <div className="text-sm text-gray-700 mt-1">{r.snippet}</div>
              </div>
              <div className="flex flex-col gap-2">
                {r.type === 'patient' && (
                  <button onClick={() => navigate(`/patients/${r.id}`)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Open Patient</button>
                )}
                {r.type === 'encounter' && (
                  <button onClick={() => navigate(`/encounters/${r.id}`)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Open Encounter</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {Array.isArray(results) && results.length === 0 && q && !loading && (
        <p className="text-gray-500">No results found.</p>
      )}
    </div>
  );
};

export default LocalSearch;
