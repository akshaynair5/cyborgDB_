import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import {useNavigate} from 'react-router-dom';

export const CyborgSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useApp();
  const [activeItem, setActiveItem] = useState(null);
  const navigate = useNavigate();

  const doSearch = async () => {
    if (!query || query.trim().length === 0) {
      toast.error('Enter a search query');
      return;
    }
    setLoading(true);
    try {
      const payload = { query, hospital_ids: user?.hospital ? [user.hospital] : [], top_k: 50 };
      const res = await api.cyborgSearch(payload);
      const body = res?.data?.data?.results || res?.data?.results || res?.data || res;
      setResults(body);
    } catch (err) {
      console.error('Cyborg search failed', err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Natural Language Search</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about patients, encounters, labs, imaging..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          onClick={doSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="bg-white rounded-lg p-4">
        {!results && (
          <p className="text-gray-500">No results yet. Try a natural language query above.</p>
        )}

        {results && Array.isArray(results) && (
          <div>
            <h3 className="text-lg font-medium mb-3">Results ({results.length})</h3>
            <ul className="space-y-2">
              {results.map((r, i) => {
                // flexible shapes: try common fields
                const id = r.encounter_id || r.id || r._id || `item-${i}`;
                const title = r.title || r.summary || r.snippet || `Match ${i + 1}`;
                const hosp = r.hospital_id || r.hospital || r.hospitalId || null;
                const score = r.score || r.similarity || (r.meta && r.meta.score) || null;
                const sameHospital = user && hosp && String(user.hospital) === String(hosp);

                return (
                  <li key={id} className="p-3 border rounded hover:shadow cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-800">{title}</div>
                        <div className="text-xs text-gray-500 mt-1">Hospital: {hosp || 'unknown'} {sameHospital && <span className="text-green-600 font-medium">(local)</span>}</div>
                        {score && <div className="text-xs text-gray-500">Score: {Number(score).toFixed(3)}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveItem({ data: r, sameHospital })}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {results && !Array.isArray(results) && (
          <div>
            <h3 className="text-lg font-medium mb-3">Results</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-3 rounded">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Modal for showing full encounter or redacted summary */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold">{activeItem.data.title || activeItem.data.summary || 'Result Detail'}</h2>
              <button onClick={() => setActiveItem(null)} className="text-gray-500">Close</button>
            </div>

            <div className="mt-4">
                {activeItem.sameHospital ? (
                  <StructuredEncounterView
                    data={activeItem.data}
                    onOpenPatient={(patientId) => {
                      setActiveItem(null);
                      if (patientId) navigate(`/patients/${patientId}`);
                    }}
                    onOpenEncounter={(encId) => {
                      setActiveItem(null);
                      if (encId) navigate(`/encounters/${encId}`);
                    }}
                  />
                ) : (
                  <div>
                    <h3 className="text-sm text-gray-600 mb-2">Redacted Summary (different hospital)</h3>
                    <div className="text-sm text-gray-700 mb-3">
                      {activeItem.data.summary || activeItem.data.snippet || 'No summary available.'}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-3 rounded">
                      {JSON.stringify({
                        encounter_id: activeItem.data.encounter_id || activeItem.data.id || activeItem.data._id,
                        hospital_id: activeItem.data.hospital_id || activeItem.data.hospital,
                        score: activeItem.data.score || activeItem.data.similarity
                      }, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyborgSearch;

// ------------------------------
// StructuredEncounterView helper
// ------------------------------
function StructuredEncounterView({ data = {}, onOpenPatient, onOpenEncounter }) {
  // tolerant extraction of common fields
  const encounterId = data.encounter_id || data.id || data._id || null;
  const patientId = data.patient_id || data.patient || (data.patientInfo && (data.patientInfo.id || data.patientInfo._id)) || null;
  const patientName = data.patient_name || (data.patientInfo && (data.patientInfo.name || `${data.patientInfo.firstName || ''} ${data.patientInfo.lastName || ''}`)) || null;
  const date = data.encounter_date || data.date || data.timestamp || data.created_at || null;
  const diagnoses = data.diagnoses || data.diagnoses_found || data.dx || [];
  const medications = data.medications || data.meds || data.prescriptions || [];
  const labs = data.labs || data.lab_results || data.tests || [];
  const imaging = data.imaging || data.imaging_reports || [];
  const summary = data.summary || data.snippet || data.excerpt || '';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold">{patientName || (patientId ? `Patient ${patientId}` : 'Unknown Patient')}</div>
          <div className="text-sm text-gray-500">Encounter: {encounterId || '—'} • Date: {date ? String(date) : 'unknown'}</div>
        </div>
        <div className="flex items-center gap-2">
          {patientId && (
            <button onClick={() => onOpenPatient(patientId)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Open Patient</button>
          )}
          {encounterId && (
            <button onClick={() => onOpenEncounter(encounterId)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Open Encounter</button>
          )}
        </div>
      </div>

      {summary && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Summary</h4>
          <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded mt-1">{summary}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700">Diagnoses</h5>
          {Array.isArray(diagnoses) && diagnoses.length > 0 ? (
            <ul className="text-sm mt-2 space-y-1">
              {diagnoses.map((dx, i) => (
                <li key={i} className="text-gray-700">{typeof dx === 'string' ? dx : (dx.description || dx.name || dx.code || JSON.stringify(dx))}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 mt-1">No diagnoses</div>
          )}
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700">Medications</h5>
          {Array.isArray(medications) && medications.length > 0 ? (
            <ul className="text-sm mt-2 space-y-1">
              {medications.map((m, i) => (
                <li key={i} className="text-gray-700">{typeof m === 'string' ? m : (m.name || m.drug || JSON.stringify(m))}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 mt-1">No meds</div>
          )}
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700">Labs / Imaging</h5>
          {((Array.isArray(labs) && labs.length > 0) || (Array.isArray(imaging) && imaging.length > 0)) ? (
            <div className="text-sm mt-2 space-y-1 text-gray-700">
              {Array.isArray(labs) && labs.map((t, i) => (
                <div key={`lab-${i}`}>{typeof t === 'string' ? t : (t.testName || t.name || JSON.stringify(t))}</div>
              ))}
              {Array.isArray(imaging) && imaging.map((img, i) => (
                <div key={`img-${i}`}>{typeof img === 'string' ? img : (img.modality || img.report || JSON.stringify(img))}</div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-1">No labs or imaging</div>
          )}
        </div>
      </div>

      <div>
        <h5 className="text-sm font-medium text-gray-700">Raw Data</h5>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-3 rounded mt-1 max-h-48 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
