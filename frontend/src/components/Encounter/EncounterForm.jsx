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
    if (!values.patient) {
      toast.error('Please select or create a patient first');
      return;
    }

    const hospital = user?.hospital;

    /* --------------------------------------------------
       STEP 1: CREATE CHILD RESOURCES FIRST
    -------------------------------------------------- */

    const diagnosisIds = [];
    const prescriptionIds = [];
    const labIds = [];
    const imagingIds = [];

    /* ---------- DIAGNOSES ---------- */
    for (const d of values.diagnoses || []) {
      if (!d?.description) continue;

      const payload = {
        patient: values.patient,
        hospital,
        code: d.code || '',
        description: d.description,
        isPrimary: !!d.isPrimary,
        recordedBy: user?._id,
      };

      const res = await api.createDiagnosis(payload);
      console.log('Diagnosis response:', res?.data);

      const diagId =
        res?.data?.data?.diagnosis?._id ||
        res?.data?.diagnosis?._id ||
        res?.data?.message?.diagnosis?._id ||
        res?.data?._id;

      if (diagId) {
        diagnosisIds.push(diagId);
      } else {
        console.warn('Diagnosis ID NOT FOUND', res?.data);
      }
    }

    /* ---------- PRESCRIPTIONS ---------- */
    for (const p of values.prescriptions || []) {
      if (!p?.name) continue;

      const payload = {
        patient: values.patient,
        hospital,
        prescribedBy: user?._id,
        items: [{
          name: p.name,
          dosage: p.dosage || '',
          frequency: p.frequency || '',
          durationDays: p.durationDays || 0,
          instructions: p.instructions || '',
          quantity: p.quantity || 1,
        }],
        notes: p.notes || '',
      };

      const res = await api.createPrescription(payload);
      console.log('Prescription response:', res?.data);

      const presId =
        res?.data?.data?.prescription?._id ||
        res?.data?.prescription?._id ||
        res?.data?.message?.prescription?._id ||
        res?.data?._id;

      if (presId) {
        prescriptionIds.push(presId);
      } else {
        console.warn('Prescription ID NOT FOUND', res?.data);
      }
    }

    /* ---------- LAB RESULTS ---------- */
    for (const l of values.labs || []) {
      if (!l?.testName) continue;

      const payload = {
        patient: values.patient,
        hospital,
        orderedBy: user?._id,
        status: l.status || 'ordered',
        collectedAt: l.collectedAt ? new Date(l.collectedAt) : undefined,
        reportedAt: l.reportedAt ? new Date(l.reportedAt) : undefined,
        tests: [{
          testName: l.testName,
          value: l.value || '',
          units: l.units || '',
          referenceRange: l.referenceRange || '',
          flagged: !!l.flagged,
        }],
      };

      const res = await api.createLabResult(payload);
      console.log('Lab response:', res?.data);

      const labId =
        res?.data?.data?.labResult?._id ||
        res?.data?.labResult?._id ||
        res?.data?.message?.labResult?._id ||
        res?.data?._id;

      if (labId) {
        labIds.push(labId);
      } else {
        console.warn('Lab ID NOT FOUND', res?.data);
      }
    }

    /* ---------- IMAGING ---------- */
    for (const img of values.imaging || []) {
      if (!img?.modality) continue;

      const payload = {
        patient: values.patient,
        hospital,
        modality: img.modality,
        studyName: img.studyName,
        report: img.report || '',
        performedAt: img.performedAt ? new Date(img.performedAt) : undefined,
        reportedAt: img.reportedAt ? new Date(img.reportedAt) : undefined,
      };

      const res = await api.createImagingReport(payload);
      console.log('Imaging response:', res?.data);

      const imgId =
        res?.data?.data?.imagingReport?._id ||
        res?.data?.imagingReport?._id ||
        res?.data?.message?.imagingReport?._id ||
        res?.data?._id;

      if (imgId) {
        imagingIds.push(imgId);
      } else {
        console.warn('Imaging ID NOT FOUND', res?.data);
      }
    }

    console.log('Collected IDs:', {
      diagnosisIds,
      prescriptionIds,
      labIds,
      imagingIds,
    });

    /* --------------------------------------------------
       STEP 2: CREATE / UPDATE ENCOUNTER WITH IDS
    -------------------------------------------------- */

    const encounterPayload = {
      patient: values.patient,
      hospital,
      encounterType: values.encounterType,
      seenBy: values.seenBy,
      chiefComplaint: values.chiefComplaint,
      historyOfPresentIllness: values.historyOfPresentIllness,
      examination: values.examination,
      vitals: values.vitals,
      notes: values.notes,
      startedAt: values.startedAt,

      diagnoses: diagnosisIds,
      prescriptions: prescriptionIds,
      labs: labIds,
      imaging: imagingIds,
    };

    let encounterId = id;

    if (id) {
      const res = await api.updateEncounter(id, encounterPayload);
      console.log('Encounter update response:', res?.data);
      toast.success('Encounter updated');
    } else {
      const res = await api.createEncounter(encounterPayload);
      console.log('Encounter create response:', res?.data);

      encounterId =
        res?.data?.data?.encounter?._id ||
        res?.data?.encounter?._id ||
        res?.data?._id;

      toast.success('Encounter created');
    }

    /* ---------- Admission ---------- */
    if (values.admission?.ward) {
      const res = await api.createAdmission({
        ...values.admission,
        patient: values.patient,
        encounter: encounterId,
        hospital,
      });
      console.log('Admission response:', res?.data);
    }

    toast.success('Encounter saved successfully');
    navigate('/encounters');

  } catch (error) {
    console.error('Encounter save error:', error);
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
                    <div className="space-y-4">
                      {(form.values.prescriptions || []).map((pres, idx) => (
                        <div key={idx} className="border p-4 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-sm text-gray-600">Medicine Name *</label>
                              <Field 
                                name={`prescriptions.${idx}.name`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., Amoxicillin"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Dosage</label>
                              <Field 
                                name={`prescriptions.${idx}.dosage`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., 500mg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Frequency</label>
                              <Field 
                                name={`prescriptions.${idx}.frequency`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., Twice daily"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-sm text-gray-600">Duration (days)</label>
                              <Field 
                                type="number"
                                name={`prescriptions.${idx}.durationDays`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., 7"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Quantity</label>
                              <Field 
                                type="number"
                                name={`prescriptions.${idx}.quantity`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., 14"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-sm text-gray-600">Instructions</label>
                            <Field 
                              as="textarea"
                              name={`prescriptions.${idx}.instructions`} 
                              rows={2}
                              className="w-full px-3 py-2 border rounded" 
                              placeholder="e.g., Take after meals"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="block text-sm text-gray-600">Notes (Optional)</label>
                            <Field 
                              as="textarea"
                              name={`prescriptions.${idx}.notes`} 
                              rows={2}
                              className="w-full px-3 py-2 border rounded" 
                              placeholder="Additional notes about the prescription"
                            />
                          </div>

                          <button 
                            type="button" 
                            onClick={() => remove(idx)} 
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove Prescription
                          </button>
                        </div>
                      ))}

                      <button 
                        type="button" 
                        onClick={() => push({ 
                          name: '', 
                          dosage: '', 
                          frequency: '', 
                          durationDays: 0, 
                          quantity: 1,
                          instructions: '',
                          notes: ''
                        })} 
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add prescription
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lab Tests</h3>
                <FieldArray name="labs">
                  {({ push, remove, form }) => (
                    <div className="space-y-4">
                      {(form.values.labs || []).map((lab, idx) => (
                        <div key={idx} className="border p-4 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-sm text-gray-600">Test Name *</label>
                              <Field 
                                name={`labs.${idx}.testName`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., CBC, HbA1c"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Value</label>
                              <Field 
                                name={`labs.${idx}.value`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., 7.2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Units</label>
                              <Field 
                                name={`labs.${idx}.units`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., mg/dL, %"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <label className="block text-sm text-gray-600">Reference Range</label>
                              <Field 
                                name={`labs.${idx}.referenceRange`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., 4.0-6.0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Status</label>
                              <Field 
                                as="select" 
                                name={`labs.${idx}.status`} 
                                className="w-full px-3 py-2 border rounded"
                              >
                                <option value="ordered">Ordered</option>
                                <option value="collected">Collected</option>
                                <option value="reported">Reported</option>
                                <option value="cancelled">Cancelled</option>
                              </Field>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2">
                                <Field type="checkbox" name={`labs.${idx}.flagged`} />
                                <span className="text-sm">Flagged/Abnormal</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-600">Collected At</label>
                              <Field 
                                type="datetime-local" 
                                name={`labs.${idx}.collectedAt`} 
                                className="w-full px-3 py-2 border rounded" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Reported At</label>
                              <Field 
                                type="datetime-local" 
                                name={`labs.${idx}.reportedAt`} 
                                className="w-full px-3 py-2 border rounded" 
                              />
                            </div>
                          </div>

                          <button 
                            type="button" 
                            onClick={() => remove(idx)} 
                            className="mt-3 text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove Lab Test
                          </button>
                        </div>
                      ))}

                      <button 
                        type="button" 
                        onClick={() => push({ 
                          testName: '', 
                          value: '', 
                          units: '', 
                          referenceRange: '',
                          flagged: false,
                          status: 'ordered',
                          collectedAt: '',
                          reportedAt: ''
                        })} 
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add lab test
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Imaging Reports</h3>
                <FieldArray name="imaging">
                  {({ push, remove, form }) => (
                    <div className="space-y-4">
                      {(form.values.imaging || []).map((img, idx) => (
                        <div key={idx} className="border p-4 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-sm text-gray-600">Modality *</label>
                              <Field 
                                as="select" 
                                name={`imaging.${idx}.modality`} 
                                className="w-full px-3 py-2 border rounded"
                              >
                                <option value="XRAY">X-Ray</option>
                                <option value="USG">Ultrasound (USG)</option>
                                <option value="CT">CT Scan</option>
                                <option value="MRI">MRI</option>
                                <option value="ECG">ECG</option>
                                <option value="OTHER">Other</option>
                              </Field>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Body Part/Study</label>
                              <Field 
                                name={`imaging.${idx}.studyName`} 
                                className="w-full px-3 py-2 border rounded" 
                                placeholder="e.g., Chest, Abdomen"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-sm text-gray-600">Report/Findings</label>
                            <Field 
                              as="textarea"
                              name={`imaging.${idx}.report`} 
                              rows={3}
                              className="w-full px-3 py-2 border rounded" 
                              placeholder="Enter imaging findings and interpretation"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-600">Performed At</label>
                              <Field 
                                type="datetime-local" 
                                name={`imaging.${idx}.performedAt`} 
                                className="w-full px-3 py-2 border rounded" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Reported At</label>
                              <Field 
                                type="datetime-local" 
                                name={`imaging.${idx}.reportedAt`} 
                                className="w-full px-3 py-2 border rounded" 
                              />
                            </div>
                          </div>

                          <button 
                            type="button" 
                            onClick={() => remove(idx)} 
                            className="mt-3 text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove Imaging Report
                          </button>
                        </div>
                      ))}

                      <button 
                        type="button" 
                        onClick={() => push({ 
                          modality: 'XRAY', 
                          report: '',
                          studyName: '',
                          performedAt: '',
                          reportedAt: ''
                        })} 
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add imaging report
                      </button>
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