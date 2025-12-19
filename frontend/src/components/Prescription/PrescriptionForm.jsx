import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const prescriptionSchema = Yup.object().shape({
  patient: Yup.string().required('Patient is required'),
  prescribedBy: Yup.string().required('Prescriber is required'),
  items: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Medicine name is required'),
      dosage: Yup.string(),
      frequency: Yup.string(),
      durationDays: Yup.number(),
    })
  ),
});

export const PrescriptionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useApp();
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(!!id);

  // Fetch patients and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, usersRes] = await Promise.all([
          api.getPatients(user?.hospital || ''),
          api.getUsers(user?.hospital || ''),
        ]);
        setPatients(patientsRes?.data?.message?.patients || []);
        setUsers(usersRes?.data?.message?.users || []);
      } catch (error) {
        toast.error('Failed to fetch patients or users');
      }
    };
    fetchData();
  }, [user?.hospital]);

  // Fetch prescription if editing
  useEffect(() => {
    if (!id) return;
    const fetchPrescription = async () => {
      try {
        const res = await api.getPrescriptionById(id);
        const presc = res?.data?.message?.prescription || res?.data?.prescription || res?.data;
        setPrescription({
          ...presc,
          patient: presc?.patient?._id || '',
          prescribedBy: presc?.prescribedBy?._id || user?._id || '',
        });
        if (presc?.patient?._id) fetchEncountersForPatient(presc.patient._id);
      } catch (err) {
        toast.error('Failed to fetch prescription');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescription();
  }, [id, user?._id]);

  const fetchEncountersForPatient = async (patientId) => {
    if (!patientId) return setEncounters([]);
    try {
      const res = await api.getEncountersForPatient(patientId);
      setEncounters(res?.data?.message?.encounters || res?.data?.encounters || []);
    } catch {
      setEncounters([]);
    }
  };

  const initialValues = prescription || {
    patient: '',
    prescribedBy: user?._id || '',
    encounter: '',
    items: [{ name: '', dosage: '', frequency: '', durationDays: '', instructions: '', quantity: '' }],
    notes: '',
  };

  const handleSubmit = async (values) => {
    try {
      values.hospital = user?.hospital;
      if (id) {
        await api.updatePrescription(id, values);
        toast.success('Prescription updated successfully');
      } else {
        await api.createPrescription(values);
        toast.success('Prescription created successfully');
      }
      navigate('/prescriptions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save prescription');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/prescriptions')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Prescription</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={prescriptionSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <Field name="patient">
                    {({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => {
                          setFieldValue('patient', e.target.value);
                          setFieldValue('encounter', '');
                          fetchEncountersForPatient(e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a patient</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.firstName} {p.lastName} ({p.hospitalId})
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <ErrorMessage name="patient" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Prescribed By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prescribed By</label>
                  <Field as="select" name="prescribedBy" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select prescriber</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        Dr. {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="prescribedBy" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Encounter */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encounter (optional)</label>
                  <Field as="select" name="encounter" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select an encounter (optional)</option>
                    {encounters.map((c) => (
                      <option key={c._id} value={c._id}>
                        {new Date(c.startedAt).toLocaleString()} — {c.encounterType}
                      </option>
                    ))}
                  </Field>
                </div>
              </div>

              {/* Prescription Items */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Medications</h3>
                <FieldArray name="items">
                  {(arrayHelpers) => (
                    <div className="space-y-4">
                      {values.items && values.items.length > 0 && values.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
                              <Field type="text" name={`items.${index}.name`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              <ErrorMessage name={`items.${index}.name`} component="p" className="text-red-500 text-sm mt-1" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                              <Field type="text" name={`items.${index}.dosage`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                              <Field type="text" name={`items.${index}.frequency`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                              <Field type="number" name={`items.${index}.durationDays`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                              <Field type="text" name={`items.${index}.instructions`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                              <Field type="number" name={`items.${index}.quantity`} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </div>
                          {values.items.length > 1 && (
                            <div className="flex justify-end">
                              <button type="button" onClick={() => arrayHelpers.remove(index)} className="text-red-600 hover:text-red-800 flex items-center gap-2">
                                <Trash2 size={18} /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => arrayHelpers.push({ name: '', dosage: '', frequency: '', durationDays: '', instructions: '', quantity: '' })} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium">
                        <Plus size={18} /> Add Medication
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <Field as="textarea" name="notes" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter additional notes" />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 border-t pt-6">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Prescription'}
                </button>
                <button type="button" onClick={() => navigate('/prescriptions')} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition">
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
