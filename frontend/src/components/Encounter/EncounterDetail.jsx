import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Save, Power, Trash2, Plus, Calendar, User, Activity } from 'lucide-react';

const encounterSchema = Yup.object().shape({
  patient: Yup.string(),
  encounterType: Yup.string().oneOf(['outpatient', 'inpatient', 'emergency', 'teleconsult']),
  chiefComplaint: Yup.string(),
  historyOfPresentIllness: Yup.string(),
  examination: Yup.string(),
  notes: Yup.string(),
  vitals: Yup.object().shape({
    temperatureC: Yup.number(),
    pulse: Yup.number(),
    respiratoryRate: Yup.number(),
    systolicBP: Yup.number(),
    diastolicBP: Yup.number(),
    spo2: Yup.number(),
    weightKg: Yup.number(),
    heightCm: Yup.number(),
  }),
});

export const EncounterDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user, currentEncounter, setCurrentEncounter } = useApp();
  const [encounter, setEncounter] = useState(currentEncounter || location.state?.encounter || null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [loading, setLoading] = useState(!encounter);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [endingEncounter, setEndingEncounter] = useState(false);

  useEffect(() => {
    fetchEncounterAndRelated();
  }, [id]);

  const fetchEncounterAndRelated = async () => {
    // If we already have encounter data from navigation, just fetch related data
    if (encounter) {
      try {
        const [diagRes, presRes, labRes, imgRes] = await Promise.all([
          api.getDiagnosesForEncounter(id),
          api.getPrescriptionsForEncounter(id),
          api.getLabResultsForEncounter(id),
          api.getImagingReportsForEncounter(id),
        ]);
        console.log(encounter)
        // console.log('Fetched related encounter data:', { diagRes?.data, presRes?.data, labRes?.data, imgRes?.data });
        const diagPayload = encounter.diagnoses || diagRes?.data?.message?.diagnoses || diagRes?.data?.diagnoses || diagRes?.data || [];
        const presPayload = encounter.prescriptions || presRes?.data?.message?.prescriptions || presRes?.data?.prescriptions || presRes?.data || [];
        const labPayload = encounter.labs || labRes?.data?.data?.labs || labRes?.data?.labs || labRes?.data || [];
        const imgPayload = encounter.imaging || imgRes?.data?.data?.imaging || imgRes?.data?.imaging || imgRes?.data || [];
        setDiagnoses(diagPayload);
        setPrescriptions(presPayload);
        setLabs(labPayload);
        setImaging(imgPayload);
      } catch (error) {
        console.error('Failed to fetch related encounter data:', error);
      }
      setLoading(false);
      return;
    }

    // Otherwise, fetch full encounter and all related data
    try {
      const [encRes, diagRes, presRes, labRes, imgRes] = await Promise.all([
        api.getEncounterById(id),
        api.getDiagnosesForEncounter(id),
        api.getPrescriptionsForEncounter(id),
        api.getLabResultsForEncounter(id),
        api.getImagingReportsForEncounter(id),
      ]);

      const encPayload = encRes?.data?.data?.encounter || encRes?.data?.encounter || encRes?.data || null;
      const diagPayload = diagRes?.data?.data?.diagnoses || diagRes?.data?.diagnoses || diagRes?.data || [];
      const presPayload = presRes?.data?.data?.prescriptions || presRes?.data?.prescriptions || presRes?.data || [];
      const labPayload = labRes?.data?.data?.labs || labRes?.data?.labs || labRes?.data || [];
      const imgPayload = imgRes?.data?.data?.imaging || imgRes?.data?.imaging || imgRes?.data || [];

      setEncounter(encPayload);
      setCurrentEncounter(encPayload);
      setDiagnoses(diagPayload);
      setPrescriptions(presPayload);
      setLabs(labPayload);
      setImaging(imgPayload);
    } catch (error) {
      console.error('Failed to fetch encounter:', error);
      toast.error('Failed to fetch encounter');
      navigate('/encounters');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const updatePayload = { ...values };
      const res = await api.updateEncounter(id, updatePayload);
      const updated = res?.data?.data?.encounter || res?.data?.encounter || res?.data || null;
      setEncounter(updated);
      setIsEditing(false);
      toast.success('Encounter updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update encounter');
    } finally {
      setSaving(false);
    }
  };

  const handleEndEncounter = async () => {
    if (!window.confirm('Are you sure you want to end this encounter? It will be sent to the vector database.')) {
      return;
    }
    setEndingEncounter(true);
    try {
      const res = await api.endEncounter(id);
      const updated = res?.data?.data?.encounter || res?.data?.encounter || res?.data || null;
      setEncounter(updated);
      toast.success('Encounter ended and stored successfully');
      navigate('/encounters');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end encounter');
    } finally {
      setEndingEncounter(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this encounter permanently?')) {
      return;
    }
    try {
      await api.deleteEncounter(id);
      toast.success('Encounter deleted');
      navigate('/encounters');
    } catch (error) {
      toast.error('Failed to delete encounter');
    }
  };

  if (loading) return <div className="text-center py-10">Loading encounter...</div>;
  if (!encounter) return <div className="text-center py-10">Encounter not found</div>;

  const isEnded = !!encounter.endedAt;
  const patientName = encounter.patient ? `${encounter.patient.firstName} ${encounter.patient.lastName}` : 'Unknown';
  const seenByName = encounter.seenBy ? `${encounter.seenBy.firstName} ${encounter.seenBy.lastName}` : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/encounters')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
        >
          <ArrowLeft size={20} /> Back to Encounters
        </button>

        <div className="flex gap-3">
          {!isEnded && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Activity size={18} /> Edit
              </button>
              <button
                onClick={handleEndEncounter}
                disabled={endingEncounter}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <Power size={18} /> {endingEncounter ? 'Ending...' : 'End Encounter'}
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      {isEnded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-3 h-3 bg-amber-500 rounded-full" />
          <div>
            <p className="font-semibold text-amber-900">Encounter Ended</p>
            <p className="text-sm text-amber-700">
              Ended on {new Date(encounter.endedAt).toLocaleString()} and stored in vector database
            </p>
          </div>
        </div>
      )}

      {/* Patient & Encounter Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-600 text-sm">Patient</p>
            <p className="text-xl font-semibold text-gray-900">{patientName}</p>
            {encounter.patient && (
              <p className="text-sm text-gray-500">MRN: {encounter.patient.hospitalId}</p>
            )}
          </div>

          <div>
            <p className="text-gray-600 text-sm">Encounter Type</p>
            <p className="text-xl font-semibold text-gray-900 capitalize">{encounter.encounterType}</p>
          </div>

          <div>
            <p className="text-gray-600 text-sm">Started</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(encounter.startedAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(encounter.startedAt).toLocaleTimeString()}
            </p>
          </div>

          <div>
            <p className="text-gray-600 text-sm">Seen By</p>
            <p className="text-lg font-semibold text-gray-900">{seenByName}</p>
            {encounter.seenBy && (
              <p className="text-sm text-gray-500 capitalize">{encounter.seenBy.role}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Mode or View Mode */}
      {isEditing && !isEnded ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Edit Encounter</h2>
          <Formik
            initialValues={{
              encounterType: encounter.encounterType || 'outpatient',
              chiefComplaint: encounter.chiefComplaint || '',
              historyOfPresentIllness: encounter.historyOfPresentIllness || '',
              examination: encounter.examination || '',
              notes: encounter.notes || '',
              vitals: {
                temperatureC: encounter.vitals?.temperatureC || '',
                pulse: encounter.vitals?.pulse || '',
                respiratoryRate: encounter.vitals?.respiratoryRate || '',
                systolicBP: encounter.vitals?.systolicBP || '',
                diastolicBP: encounter.vitals?.diastolicBP || '',
                spo2: encounter.vitals?.spo2 || '',
                weightKg: encounter.vitals?.weightKg || '',
                heightCm: encounter.vitals?.heightCm || '',
              },
            }}
            validationSchema={encounterSchema}
            onSubmit={handleSave}
            enableReinitialize
          >
            {({ isSubmitting, values }) => (
              <Form className="space-y-6">
                {/* Encounter Type & Chief Complaint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Encounter Type</label>
                    <Field
                      as="select"
                      name="encounterType"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="outpatient">Outpatient</option>
                      <option value="inpatient">Inpatient</option>
                      <option value="emergency">Emergency</option>
                      <option value="teleconsult">Teleconsult</option>
                    </Field>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
                    <Field
                      type="text"
                      name="chiefComplaint"
                      placeholder="Chief complaint"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* History & Examination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">History of Present Illness</label>
                    <Field
                      as="textarea"
                      name="historyOfPresentIllness"
                      rows={4}
                      placeholder="History..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Physical Examination</label>
                    <Field
                      as="textarea"
                      name="examination"
                      rows={4}
                      placeholder="Examination findings..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Vital Signs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                      <Field
                        type="number"
                        name="vitals.temperatureC"
                        step="0.1"
                        placeholder="36.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pulse (bpm)</label>
                      <Field
                        type="number"
                        name="vitals.pulse"
                        placeholder="72"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Respiratory Rate</label>
                      <Field
                        type="number"
                        name="vitals.respiratoryRate"
                        placeholder="16"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SpO2 (%)</label>
                      <Field
                        type="number"
                        name="vitals.spo2"
                        placeholder="98"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Systolic BP</label>
                      <Field
                        type="number"
                        name="vitals.systolicBP"
                        placeholder="120"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diastolic BP</label>
                      <Field
                        type="number"
                        name="vitals.diastolicBP"
                        placeholder="80"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                      <Field
                        type="number"
                        name="vitals.weightKg"
                        step="0.1"
                        placeholder="70"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                      <Field
                        type="number"
                        name="vitals.heightCm"
                        placeholder="170"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <Field
                    as="textarea"
                    name="notes"
                    rows={4}
                    placeholder="Additional notes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex border-b overflow-x-auto">
              {['overview', 'diagnoses', 'prescriptions', 'labs', 'imaging', 'vitals'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Chief Complaint</h3>
                    <p className="text-gray-600">{encounter.chiefComplaint || 'Not provided'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">History of Present Illness</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{encounter.historyOfPresentIllness || 'Not provided'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Physical Examination</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{encounter.examination || 'Not provided'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{encounter.notes || 'No additional notes'}</p>
                  </div>
                </div>
              )}

              {/* Diagnoses Tab */}
              {activeTab === 'diagnoses' && (
                <div className="space-y-3">
                  {diagnoses && diagnoses.length > 0 ? (
                    diagnoses.map((diag, i) => (
                      <div key={diag._id || i} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{diag.description}</p>
                            <p className="text-sm text-gray-600">Code: {diag.code || 'N/A'}</p>
                            {diag.isPrimary && (
                              <span className="inline-block mt-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                Primary
                              </span>
                            )}
                            {diag.recordedBy && (
                              <p className="text-xs text-gray-500 mt-2">
                                Recorded by: {diag.recordedBy.firstName} {diag.recordedBy.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No diagnoses recorded</p>
                  )}
                </div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {prescriptions && prescriptions.length > 0 ? (
                    prescriptions.map((rx, i) => (
                      <div key={rx._id || i} className="border rounded-lg p-4 bg-gray-50">
                        <p className="font-semibold text-gray-900 mb-2">
                          {rx.items?.[0]?.name || 'Prescription'}
                        </p>
                        {rx.prescribedBy && (
                          <p className="text-xs text-gray-500 mb-2">
                            By: {rx.prescribedBy.firstName} {rx.prescribedBy.lastName}
                          </p>
                        )}
                        {rx.items && rx.items.map((item, idx) => (
                          <div key={idx} className="space-y-1 text-sm text-gray-600">
                            <p><strong>Dosage:</strong> {item.dosage}</p>
                            <p><strong>Frequency:</strong> {item.frequency}</p>
                            <p><strong>Duration:</strong> {item.durationDays} days</p>
                            {item.instructions && <p><strong>Instructions:</strong> {item.instructions}</p>}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No prescriptions recorded</p>
                  )}
                </div>
              )}

              {/* Labs Tab */}
              {activeTab === 'labs' && (
                <div className="space-y-3">
                  {labs && labs.length > 0 ? (
                    labs.map((lab, i) => (
                      <div key={lab._id || i} className="border rounded-lg p-4 bg-gray-50">
                        <p className="font-semibold text-gray-900 mb-2">
                          {new Date(lab.createdAt).toLocaleDateString()}
                        </p>
                        {lab.orderedBy && (
                          <p className="text-xs text-gray-500 mb-2">
                            Ordered by: {lab.orderedBy.firstName} {lab.orderedBy.lastName}
                          </p>
                        )}
                        {lab.tests && lab.tests.map((test, idx) => (
                          <div key={idx} className="space-y-1 text-sm text-gray-600 mb-2">
                            <p><strong>{test.testName}</strong></p>
                            <p>Value: {test.value} {test.units}</p>
                            {test.referenceRange && <p>Reference: {test.referenceRange}</p>}
                            {test.flagged && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs rounded">Flagged</span>}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No lab results recorded</p>
                  )}
                </div>
              )}

              {/* Imaging Tab */}
              {activeTab === 'imaging' && (
                <div className="space-y-3">
                  {imaging && imaging.length > 0 ? (
                    imaging.map((img, i) => (
                      <div key={img._id || i} className="border rounded-lg p-4 bg-gray-50">
                        <p className="font-semibold text-gray-900 mb-2">{img.modality}</p>
                        <p className="text-sm text-gray-600 mb-2">{new Date(img.createdAt).toLocaleDateString()}</p>
                        {img.report && (
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                            {img.report}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No imaging reports recorded</p>
                  )}
                </div>
              )}

              {/* Vitals Tab */}
              {activeTab === 'vitals' && encounter.vitals && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(encounter.vitals).map(([key, value]) => {
                    const labels = {
                      temperatureC: 'Temperature (°C)',
                      pulse: 'Pulse (bpm)',
                      respiratoryRate: 'Respiratory Rate',
                      systolicBP: 'Systolic BP',
                      diastolicBP: 'Diastolic BP',
                      spo2: 'SpO2 (%)',
                      weightKg: 'Weight (kg)',
                      heightCm: 'Height (cm)',
                    };
                    return value ? (
                      <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 uppercase">{labels[key]}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
