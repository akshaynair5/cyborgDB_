import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const CyborgSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [scope, setScope] = useState('global');
  const [showRaw, setShowRaw] = useState(false);
  const { user } = useApp();
  const navigate = useNavigate();
  const CyborgDBURL = import.meta.env.VITE_CYBORG_DB_URL || 'http://localhost:7000';

  // Safely render any value
  const safeRender = (value) => {
    if (!value) return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Flatten backend encounter for display
  const flattenEncounter = (enc) => {
    if (!enc) return {};
    const raw = enc.raw_encounter || {};
    const summary = enc.summary || {};
    return {
      ...raw,
      ...summary,
      diagnosis: summary.diagnoses ? summary.diagnoses.join(', ') : raw.diagnosis || 'N/A',
      treatment: summary.plan_and_outcome || raw.treatment || 'N/A',
      outcome: summary.plan_and_outcome || raw.outcome || 'N/A',
      chief_complaint: summary.chief_complaint || raw.chief_complaint || 'N/A',
      medications: summary.medications || raw.medications || [],
    };
  };

  // Perform search
  const doSearch = async () => {
    if (!query.trim()) {
      toast.error('Enter a search query');
      return;
    }
    setLoading(true);
    setResults(null);
    setSynthesis(null);

    try {
      const response = await fetch(`${CyborgDBURL}/search-advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          scope,
          hospital_id: user.hospital,
        }),
      });
      if (!response.ok) throw new Error(`Backend error: ${response.statusText}`);
      const data = await response.json();
      const flattenedMatches = (data.matches || []).map((r) => ({
        ...r,
        encounter: flattenEncounter(r.encounter),
      }));
      setResults(flattenedMatches);
      setSynthesis(data.synthesis || null);
    } catch (err) {
      console.error('Cyborg search failed', err);
      toast.error('Search failed. Is app_secure.py running?');
    } finally {
      setLoading(false);
    }
  };

  // Full encounter modal
  function StructuredEncounterView({ data }) {
    if (!data) return <div>No Data</div>;
    return (
      <div className="space-y-4 text-sm">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
            <span className="block text-xs font-bold text-blue-500 uppercase">Date</span>
            {String(data.startedAt || 'N/A')}
          </div>
          <div className="p-3 bg-green-50/50 rounded border border-green-100">
            <span className="block text-xs font-bold text-green-600 uppercase">Outcome</span>
            {safeRender(data.outcome)}
          </div>
        </div>

        {/* Complaint & Treatment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <span className="block text-xs font-bold text-gray-500 uppercase">Treatment</span>
            {safeRender(data.treatment)}
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <span className="block text-xs font-bold text-gray-500 uppercase">Chief Complaint</span>
            {safeRender(data.chief_complaint)}
          </div>
        </div>

        {/* Diagnoses */}
        <div className="p-3 bg-white rounded border border-gray-200">
          <span className="block text-xs font-bold text-gray-500 uppercase">Diagnosis</span>
          {safeRender(data.diagnosis)}
        </div>

        {/* Vitals */}
        {data.vitals && (
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">Vitals</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(data.vitals).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1">
                  <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescriptions */}
        {data.prescriptions?.length > 0 && (
          <div className="p-3 bg-white rounded border border-gray-200">
            <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Prescriptions</span>
            <ul className="list-disc list-inside text-xs">
              {data.prescriptions.map((p) => (
                <li key={p._id}>
                  {p.items.map((item) => (
                    <span key={item.name}>
                      {item.name} {item.dosage} {item.frequency} for {item.durationDays} days
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Narrative Summary */}
        {data.narrative_summary && (
          <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
            <span className="block text-xs font-bold text-blue-500 uppercase mb-1">Narrative Summary</span>
            {safeRender(data.narrative_summary)}
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Clinical Notes</span>
            {safeRender(data.notes)}
          </div>
        )}

        {/* Collapsible Raw JSON */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs font-bold text-slate-600 mb-2 underline"
          >
            {showRaw ? 'Hide Raw Data' : 'Show Raw Data'}
          </button>
          {showRaw && (
            <pre className="whitespace-pre-wrap text-xs text-slate-600 font-mono overflow-x-auto bg-white p-2 rounded border border-slate-100">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="text-3xl">🛡️</span>
        <span className="text-blue-900">MedSec</span>
        <span className="text-blue-600 font-light">Neural Search</span>
      </h1>

      {/* SEARCH CONTROLS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-6 mb-4 text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg inline-block">
          <span className="text-gray-500 uppercase text-xs font-bold tracking-wider">Search Scope:</span>
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-700 transition-colors">
            <input type="radio" name="scope" value="global" checked={scope === 'global'} onChange={() => setScope('global')} className="text-blue-600 focus:ring-blue-500" />
            Global (Consortium)
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-700 transition-colors">
            <input type="radio" name="scope" value="local" checked={scope === 'local'} onChange={() => setScope('local')} className="text-blue-600 focus:ring-blue-500" />
            Local Only (My Hospital)
          </label>
        </div>

        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="e.g., 'patient with severe chest pain'..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-lg w-full"
          />
          <button
            onClick={doSearch}
            disabled={loading}
            className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? 'Analyzing...' : 'Search'}
          </button>
        </div>
      </div>

      {/* AI SYNTHESIS SECTION */}
      {synthesis && (
        <div className="mb-8 bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <span>🧠</span> MedSec AI Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <h4 className="font-bold text-blue-800 text-xs mb-2 uppercase tracking-wide">Clinical Insights</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{safeRender(synthesis.clinical_insights)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <h4 className="font-bold text-green-700 text-xs mb-2 uppercase tracking-wide">Outcomes & Management</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{safeRender(synthesis.management_outcomes)}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm border-l-4 border-l-purple-500">
            <h4 className="font-bold text-purple-700 text-xs mb-2 uppercase tracking-wide">Suggested Next Steps</h4>
            <p className="text-gray-700 text-sm">{safeRender(synthesis.suggested_next_steps)}</p>
          </div>
        </div>
      )}

      {/* RESULTS LIST */}
      <div className="space-y-4">
        {loading && <div className="text-center py-10 text-gray-400 animate-pulse">Running Encrypted Vector Search...</div>}
        {!loading && results && results.length === 0 && <p className="text-gray-500 text-center py-8">No matching records found.</p>}

        {results?.map((r, i) => {
          const enc = r.encounter || {};
          const isLocal = r.hospital_id === user.hospital;

          return (
            <div key={r.encounter_id || i} className="bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLocal ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isLocal ? `LOCAL (${r.hospital_id})` : `EXTERNAL (${r.hospital_id})`}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {r.encounter_id}</span>
                    <span className="text-xs text-gray-400">Score: {Number(r.score).toFixed(4)}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{safeRender(enc.diagnosis)}</h3>
                  <p className="text-gray-600 text-sm mt-1"><strong>Complaint:</strong> {safeRender(enc.chief_complaint)}</p>
                </div>
                <button
                  onClick={() => setActiveItem({ data: enc, sameHospital: isLocal })}
                  className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${isLocal ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"}`}
                >
                  {isLocal ? "View Details" : "View Redacted Summary"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className={`p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 ${activeItem.sameHospital ? 'border-blue-100' : 'border-amber-100 bg-amber-50'}`}>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeItem.sameHospital ? "Full Encounter Details" : "Confidential Clinical Snapshot"}
                </h2>
                {!activeItem.sameHospital && <span className="text-xs text-amber-700 font-bold uppercase tracking-wide">⚠ PII Redacted for Privacy</span>}
              </div>
              <button onClick={() => setActiveItem(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              {activeItem.sameHospital ? (
                <StructuredEncounterView data={activeItem.data} />
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                      <strong>Privacy Mode Active:</strong> Patient identity has been stripped.
                      <br />
                      <span className="opacity-80">Displaying anonymized clinical context.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Diagnosis (Anonymized)</h4>
                      <p className="text-lg font-semibold text-gray-900">{safeRender(activeItem.data.diagnosis)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Treatment Used</h4>
                        <p className="text-slate-800 font-medium">{safeRender(activeItem.data.treatment)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Clinical Outcome</h4>
                        <p className="text-slate-800 font-medium">{safeRender(activeItem.data.outcome)}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Presenting Complaint</h4>
                      <p className="text-gray-700 italic">"{safeRender(activeItem.data.chief_complaint)}"</p>
                    </div>
                  </div>
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
