import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

/* =======================
   VALIDATION SCHEMA
======================= */
const labResultSchema = Yup.object().shape({
  patient: Yup.string().required('Patient is required'),
  encounter: Yup.string().required('Encounter is required'),
  tests: Yup.array().of(
    Yup.object().shape({
      testName: Yup.string().required('Test name is required'),
      value: Yup.string(),
      units: Yup.string(),
    })
  ),
});

export const LabResultForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useApp();

  const [patients, setPatients] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [labResult, setLabResult] = useState(null);
  const [loading, setLoading] = useState(!!id);

  /* =======================
     EFFECTS
  ======================= */
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (id) fetchLabResult();
  }, [id]);

  /* =======================
     API CALLS
  ======================= */
  const fetchPatients = async () => {
    try {
      const res = await api.getPatients(user?.hospital || '');
      const pts = res?.data?.message?.patients || res?.data?.patients || res?.data || [];
      setPatients(pts);
    } catch {
      toast.error('Failed to fetch patients');
    }
  };

  const fetchEncountersForPatient = async (patientId) => {
    try {
      const res = await api.getEncountersForPatient(patientId);
      const list = res?.data?.message?.encounters || res?.data?.encounters || res?.data || [];
      setEncounters(list);
    } catch {
      setEncounters([]);
    }
  };

  const fetchLabResult = async () => {
    try {
      const res = await api.getLabResultById(id);
      if (res.data?.length) {
        setLabResult(res.data[0]);
        fetchEncountersForPatient(res.data[0].patient);
      }
    } catch {
      toast.error('Failed to fetch lab result');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     INITIAL VALUES
  ======================= */
  const initialValues = labResult || {
    patient: '',
    encounter: '',
    orderedBy: user?._id || '',
    collectedAt: new Date().toISOString().split('T')[0],
    reportedAt: new Date().toISOString().split('T')[0],
    tests: [{ testName: '', value: '', units: '', referenceRange: '', flagged: false }],
    status: 'ordered',
  };

  /* =======================
     SUBMIT HANDLER
  ======================= */
  const handleSubmit = async (values) => {
  try {
    if (!values.encounter) {
      toast.error('Encounter is required');
      return;
    }

    const payload = {
      ...values,
      encounterId: values.encounter, // ✅ map correctly
      hospital: user?.hospital,
    };

    delete payload.encounter; // optional but clean

    if (id) {
      await api.updateLabResult(id, payload);
      toast.success('Lab result updated successfully');
    } else {
      await api.createLabResult(payload);
      toast.success('Lab result created successfully');
    }

    navigate('/lab-results');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to save lab result');
  }
};

  if (loading) return <div className="text-center py-10">Loading...</div>;

  /* =======================
     JSX
  ======================= */
  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/lab-results')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Lab Result</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={labResultSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-6">

              {/* ================= PATIENT & ENCOUNTER ================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Patient */}
                <div>
                  <label className="block text-sm font-medium mb-2">Patient</label>
                  <Field
                    as="select"
                    name="patient"
                    className="w-full px-4 py-2 border rounded-lg"
                    onChange={(e) => {
                      setFieldValue('patient', e.target.value);
                      setFieldValue('encounter', '');
                      fetchEncountersForPatient(e.target.value);
                    }}
                  >
                    <option value="">Select patient</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="patient" component="p" className="text-red-500 text-sm" />
                </div>

                {/* Encounter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Encounter</label>
                  <Field
                    as="select"
                    name="encounter"
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select encounter</option>
                    {encounters.length > 0 && encounters.map(c => (
                      <option key={c._id} value={c._id}>
                        {new Date(c.startedAt).toLocaleString()} — {c.encounterType}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="encounter" component="p" className="text-red-500 text-sm" />
                </div>
              </div>

              {/* ================= TESTS ================= */}
              <FieldArray name="tests">
                {({ push, remove }) => (
                  <>
                    {values.tests.map((_, i) => (
                      <div key={i} className="border p-4 rounded-lg bg-gray-50">
                        <Field name={`tests.${i}.testName`} placeholder="Test Name" className="input" />
                        <Field name={`tests.${i}.value`} placeholder="Value" className="input" />
                        <Field name={`tests.${i}.units`} placeholder="Units" className="input" />

                        {values.tests.length > 1 && (
                          <button type="button" onClick={() => remove(i)} className="text-red-600">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => push({ testName: '', value: '', units: '' })}>
                      <Plus size={18} /> Add Test
                    </button>
                  </>
                )}
              </FieldArray>

              {/* ================= ACTIONS ================= */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                >
                  Save Lab Result
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/lab-results')}
                  className="flex-1 bg-gray-300 py-2 rounded-lg"
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
