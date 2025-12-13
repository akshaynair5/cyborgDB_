import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

const encounterSchema = Yup.object().shape({
  patient: Yup.string().required('Patient is required'),
  encounterType: Yup.string().oneOf(['outpatient', 'inpatient', 'emergency', 'teleconsult']),
  chiefComplaint: Yup.string(),
  historyOfPresentIllness: Yup.string(),
  examination: Yup.string(),
});

export const EncounterForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useApp();
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [encounter, setEncounter] = useState(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientSuggestedMrn, setNewPatientSuggestedMrn] = useState('');
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      fetchEncounter();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [patientsRes, usersRes] = await Promise.all([
        api.getPatients(user?.hospital || ''),
        api.getUsersByRoles(['doctor', 'nurse']),
      ]);
      const pts = patientsRes?.data?.message?.patients || patientsRes?.data?.patients || patientsRes?.data || [];
      const us = usersRes?.data?.data?.users || usersRes?.data?.users || usersRes?.data || [];
      setPatients(pts);
      setUsers(us);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  const fetchEncounter = async () => {
    try {
      const response = await api.getEncounterById(id);
      // ApiResponse shape: { success, message, data }
      const payload = response?.data?.data?.encounter || response?.data?.encounter || response?.data || response;
      setEncounter(payload);
    } catch (error) {
      toast.error('Failed to fetch encounter');
    } finally {
      setLoading(false);
    }
  };

  const initialValues = encounter || {
    patient: '',
    encounterType: 'outpatient',
    seenBy: user?._id || '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    examination: '',
    vitals: {
      temperatureC: '',
      pulse: '',
      respiratoryRate: '',
      systolicBP: '',
      diastolicBP: '',
      spo2: '',
      weightKg: '',
      heightCm: '',
    },
    diagnoses: [],
    prescriptions: [],
    labs: [],
    imaging: [],
    admission: null,
    notes: '',
  };

  const handleSubmit = async (values) => {
    try {
      values.hospital = user?.hospital;

      // Ensure patient is set (validation above should enforce this)
      if (!values.patient) {
        toast.error('Please select or create a patient first');
        return;
      }

      // 1) Create diagnoses first so we can attach their ids to the encounter
      const diagItems = values.diagnoses || [];
      const createdDiagnosisIds = [];
      for (const d of diagItems) {
        if (!d || !d.description) continue;
        try {
          const diagPayload = {
            patient: values.patient,
            code: d.code,
            description: d.description,
            isPrimary: !!d.isPrimary,
            hospital: user?.hospital,
          };
          const diagRes = await api.createDiagnosis(diagPayload);
          const diagId = diagRes?.data?.data?.diagnosis?._id || diagRes?.data?.diagnosis?._id || diagRes?.data?._id;
          if (diagId) createdDiagnosisIds.push(diagId);
        } catch (err) {
          // continue on errors for individual diagnosis creation
          console.warn('Diagnosis create failed', err?.response?.data || err.message);
        }
      }

      // Separate child resources (prescriptions, labs, imaging, admission) from encounter payload
      const childPrescriptions = values.prescriptions || [];
      const childLabs = values.labs || [];
      const childImaging = values.imaging || [];
      const admissionPayload = values.admission;

      // Build encounter payload without child arrays, but include created diagnosis ids
      const encounterPayload = { ...values };
      delete encounterPayload.prescriptions;
      delete encounterPayload.labs;
      delete encounterPayload.imaging;
      delete encounterPayload.admission;
      delete encounterPayload.diagnoses;
      if (createdDiagnosisIds.length) encounterPayload.diagnoses = createdDiagnosisIds;

      let encounterId = id;
      if (id) {
        const res = await api.updateEncounter(id, encounterPayload);
        encounterId = res?.data?.data?.encounter?._id || id;
      } else {
        const res = await api.createEncounter(encounterPayload);
        encounterId = res?.data?.data?.encounter?._id || res?.data?.encounter?._id || res?.data?._id;
      }

      // Create prescriptions and attach
      const createdPrescriptionIds = [];
      for (const p of childPrescriptions) {
        if (!p || !p.name) continue;
        const presPayload = {
          patient: values.patient,
          encounter: encounterId,
          hospital: user?.hospital,
          prescribedBy: user?._id,
          items: [{
            name: p.name,
            dosage: p.dosage,
            frequency: p.frequency,
            durationDays: p.durationDays,
            instructions: p.instructions,
            quantity: p.quantity,
          }]
        };
        const presRes = await api.createPrescription(presPayload);
        const presId = presRes?.data?.data?.prescription?._id || presRes?.data?.prescription?._id || presRes?.data?._id;
        if (presId) createdPrescriptionIds.push(presId);
      }

      // Create labs and attach
      const createdLabIds = [];
      for (const l of childLabs) {
        if (!l || !l.testName) continue;
        const labPayload = {
          patient: values.patient,
          encounter: encounterId,
          hospital: user?.hospital,
          orderedBy: user?._id,
          tests: [{ testName: l.testName, value: l.value, units: l.units, referenceRange: l.referenceRange, flagged: l.flagged }]
        };
        const labRes = await api.createLabResult(labPayload);
        const labId = labRes?.data?.data?.labResult?._id || labRes?.data?.labResult?._id || labRes?.data?._id;
        if (labId) createdLabIds.push(labId);
      }

      // Create imaging reports and attach
      const createdImagingIds = [];
      for (const img of childImaging) {
        if (!img || !img.modality) continue;
        const imgPayload = {
          ...img,
          patient: values.patient,
          encounter: encounterId,
          hospital: user?.hospital,
        };
        const imgRes = await api.createImagingReport(imgPayload);
        const imgId = imgRes?.data?.data?.imagingReport?._id || imgRes?.data?.imagingReport?._id || imgRes?.data?._id;
        if (imgId) createdImagingIds.push(imgId);
      }

      // If admission requested, create admission linked to encounter
      if (admissionPayload && admissionPayload.ward) {
        const admissionCreate = {
          ...admissionPayload,
          patient: values.patient,
          encounter: encounterId,
          hospital: user?.hospital,
        };
        await api.createAdmission(admissionCreate);
      }

      // Attach child ids to encounter if any were created
      const attachUpdates = {};
      if (createdPrescriptionIds.length) attachUpdates.prescriptions = createdPrescriptionIds;
      if (createdLabIds.length) attachUpdates.labs = createdLabIds;
      if (createdImagingIds.length) attachUpdates.imaging = createdImagingIds;
      if (Object.keys(attachUpdates).length) {
        await api.updateEncounter(encounterId, attachUpdates);
      }

      toast.success('Encounter saved successfully');
      navigate('/encounters');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save encounter');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/encounters')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Encounter</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={encounterSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Patient & Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <div className="flex gap-2">
                    <Field
                      as="select"
                      name="patient"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a patient</option>
                      {patients.length > 0 && patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.firstName} {p.lastName} ({p.hospitalId})
                        </option>
                      ))}
                      {patients.length === 0 && (<option value="" disabled>No patients available</option>)}
                    </Field>

                    <button
                      type="button"
                      onClick={async () => {
                        // fetch MRN suggestion for new patient then open modal
                        try {
                          const res = await api.getSuggestMrn();
                          const suggestion = res?.data?.data?.suggestion || res?.data?.suggestion || (res?.data && res.data.suggestion) || '';
                          setNewPatientSuggestedMrn(suggestion);
                        } catch (err) {
                          setNewPatientSuggestedMrn('');
                        }
                        setShowNewPatient(true);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      <Plus size={14} /> Add Patient
                    </button>
                  </div>
                  <ErrorMessage name="patient" component="p" className="text-red-500 text-sm mt-1" />
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seen By</label>
                  <Field
                    as="select"
                    name="seenBy"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select healthcare provider</option>
                    {users.length > 0 && users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                    {
                      users.length === 0 && (<option value="" disabled>No users available</option>)
                    }
                  </Field>
                </div>
              </div>

              {/* New Patient Modal */}
              {showNewPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Create New Patient</h3>
                      <button onClick={() => setShowNewPatient(false)} className="text-gray-500">Close</button>
                    </div>
                    <Formik
                      initialValues={{ hospitalId: newPatientSuggestedMrn || '', firstName: '', lastName: '', dob: '', gender: 'unknown', phone: '', address: '' }}
                      onSubmit={async (pv, { setSubmitting }) => {
                        try {
                          setSubmitting(true);
                          pv.hospital = user?.hospital;
                          const res = await api.createPatient(pv);
                          const newPatient = res?.data?.data?.patient || res?.data?.patient || res?.data;
                          if (newPatient && newPatient._id) {
                            setPatients(prev => [newPatient, ...prev]);
                            // set parent form field (available via closure)
                            try { setFieldValue('patient', newPatient._id); } catch(e) {}
                            toast.success('Patient created');
                            setShowNewPatient(false);
                          } else {
                            toast.success('Patient created');
                            setShowNewPatient(false);
                          }
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to create patient');
                        } finally {
                          fetchData(); 
                          setSubmitting(false);
                        }
                      }}
                    >
                      {({ isSubmitting, submitForm }) => (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-600">MRN</label>
                              <Field name="hospitalId" className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Phone</label>
                              <Field name="phone" className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">First name</label>
                              <Field name="firstName" className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Last name</label>
                              <Field name="lastName" className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">DOB</label>
                              <Field type="date" name="dob" className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Gender</label>
                              <Field as="select" name="gender" className="w-full px-3 py-2 border rounded">
                                <option value="unknown">Unknown</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </Field>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowNewPatient(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                            <button type="button" onClick={() => submitForm()} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">{isSubmitting ? 'Saving...' : 'Create'}</button>
                          </div>
                        </div>
                      )}
                    </Formik>
                  </div>
                </div>
              )}

              {/* Diagnoses (initial) - placed before chief complaint */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Initial Diagnoses</h3>
                <FieldArray name="diagnoses">
                  {({ push, remove, form }) => (
                    <div className="space-y-3">
                      {(form.values.diagnoses || []).map((d, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-sm text-gray-600">Code</label>
                            <Field name={`diagnoses.${idx}.code`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600">Description</label>
                            <Field name={`diagnoses.${idx}.description`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2">
                              <Field type="checkbox" name={`diagnoses.${idx}.isPrimary`} />
                              <span className="text-sm">Primary</span>
                            </label>
                            <button type="button" onClick={() => remove(idx)} className="text-red-500">Remove</button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <button type="button" onClick={() => push({ code: '', description: '', isPrimary: false })} className="text-sm text-blue-600">+ Add diagnosis</button>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
                <Field
                  type="text"
                  name="chiefComplaint"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter chief complaint"
                />
              </div>

              {/* History of Present Illness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">History of Present Illness</label>
                <Field
                  as="textarea"
                  name="historyOfPresentIllness"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter history of present illness"
                />
              </div>

              {/* Examination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Physical Examination</label>
                <Field
                  as="textarea"
                  name="examination"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter examination findings"
                />
              </div>

              {/* Vitals */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                    <Field
                      type="number"
                      name="vitals.temperatureC"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="36.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pulse (bpm)</label>
                    <Field
                      type="number"
                      name="vitals.pulse"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="72"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Respiratory Rate</label>
                    <Field
                      type="number"
                      name="vitals.respiratoryRate"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="16"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SpO2 (%)</label>
                    <Field
                      type="number"
                      name="vitals.spo2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="98"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Systolic BP</label>
                    <Field
                      type="number"
                      name="vitals.systolicBP"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diastolic BP</label>
                    <Field
                      type="number"
                      name="vitals.diastolicBP"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <Field
                      type="number"
                      name="vitals.weightKg"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="70"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <Field
                      type="number"
                      name="vitals.heightCm"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="170"
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
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter additional notes"
                />
              </div>

              {/* Prescriptions */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Prescriptions</h3>
                <FieldArray name="prescriptions">
                  {({ push, remove, form }) => (
                    <div className="space-y-3">
                      {(form.values.prescriptions || []).map((pres, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-sm text-gray-600">Name</label>
                            <Field name={`prescriptions.${idx}.name`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Dosage</label>
                            <Field name={`prescriptions.${idx}.dosage`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Frequency</label>
                            <Field name={`prescriptions.${idx}.frequency`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => remove(idx)} className="text-red-500">Remove</button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <button type="button" onClick={() => push({ name: '', dosage: '', frequency: '', durationDays: 0, quantity: 1 })} className="text-sm text-blue-600">+ Add prescription</button>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Labs */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lab Tests</h3>
                <FieldArray name="labs">
                  {({ push, remove, form }) => (
                    <div className="space-y-3">
                      {(form.values.labs || []).map((lab, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-sm text-gray-600">Test</label>
                            <Field name={`labs.${idx}.testName`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Value</label>
                            <Field name={`labs.${idx}.value`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Units</label>
                            <Field name={`labs.${idx}.units`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => remove(idx)} className="text-red-500">Remove</button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <button type="button" onClick={() => push({ testName: '', value: '', units: '', flagged: false })} className="text-sm text-blue-600">+ Add lab test</button>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Imaging */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Imaging Reports</h3>
                <FieldArray name="imaging">
                  {({ push, remove, form }) => (
                    <div className="space-y-3">
                      {(form.values.imaging || []).map((img, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-sm text-gray-600">Modality</label>
                            <Field as="select" name={`imaging.${idx}.modality`} className="w-full px-3 py-2 border rounded">
                              <option value="XRAY">XRAY</option>
                              <option value="USG">USG</option>
                              <option value="CT">CT</option>
                              <option value="MRI">MRI</option>
                              <option value="ECG">ECG</option>
                              <option value="OTHER">OTHER</option>
                            </Field>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Report</label>
                            <Field name={`imaging.${idx}.report`} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => remove(idx)} className="text-red-500">Remove</button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <button type="button" onClick={() => push({ modality: 'XRAY', report: '' })} className="text-sm text-blue-600">+ Add imaging</button>
                      </div>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Admission (optional) */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admission (optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
                    <Field type="text" name="admission.ward" className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bed</label>
                    <Field type="text" name="admission.bed" className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <Field type="text" name="admission.reason" className="w-full px-3 py-2 border rounded" />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 border-t pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Encounter'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/encounters')}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};