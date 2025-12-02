import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Trash2 } from 'lucide-react';

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
        api.getUsers(),
      ]);
      setPatients(patientsRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'doctor' || u.role === 'nurse'));
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  const fetchEncounter = async () => {
    try {
      const response = await api.getEncounter(id);
      setEncounter(response.data);
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
    notes: '',
  };

  const handleSubmit = async (values) => {
    try {
      values.hospital = user?.hospital;
      if (id) {
        await api.updateEncounter(id, values);
        toast.success('Encounter updated successfully');
      } else {
        await api.createEncounter(values);
        toast.success('Encounter created successfully');
      }
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
          {({ isSubmitting, values }) => (
            <Form className="space-y-6">
              {/* Patient & Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <Field
                    as="select"
                    name="patient"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a patient</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.firstName} {p.lastName} ({p.hospitalId})
                      </option>
                    ))}
                  </Field>
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
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    ))}
                  </Field>
                </div>
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