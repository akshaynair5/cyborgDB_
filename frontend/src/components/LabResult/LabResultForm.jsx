import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const labResultSchema = Yup.object().shape({
  patient: Yup.string().required('Patient is required'),
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
  const [labResult, setLabResult] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (id) {
      fetchLabResult();
    }
  }, [id]);

  const fetchPatients = async () => {
    try {
      const response = await api.getPatients(user?.hospital || '');
      setPatients(response.data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    }
  };

  const fetchLabResult = async () => {
    try {
      const response = await api.getLabResultById(id);
      if (response.data && response.data.length > 0) {
        setLabResult(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch lab result');
    } finally {
      setLoading(false);
    }
  };

  const initialValues = labResult || {
    patient: '',
    orderedBy: user?._id || '',
    collectedAt: new Date().toISOString().split('T')[0],
    reportedAt: new Date().toISOString().split('T')[0],
    tests: [{ testName: '', value: '', units: '', referenceRange: '', flagged: false }],
    status: 'ordered',
  };

  const handleSubmit = async (values) => {
    try {
      values.hospital = user?.hospital;
      if (id) {
        await api.updateLabResult(id, values);
        toast.success('Lab result updated successfully');
      } else {
        await api.createLabResult(values);
        toast.success('Lab result created successfully');
      }
      navigate('/lab-results');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lab result');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

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
          {({ isSubmitting, values }) => (
            <Form className="space-y-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Field
                    as="select"
                    name="status"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ordered">Ordered</option>
                    <option value="collected">Collected</option>
                    <option value="reported">Reported</option>
                    <option value="cancelled">Cancelled</option>
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collected At</label>
                  <Field
                    type="date"
                    name="collectedAt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reported At</label>
                  <Field
                    type="date"
                    name="reportedAt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lab Tests */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Results</h3>
                <FieldArray name="tests">
                  {(arrayHelpers) => (
                    <div className="space-y-4">
                      {values.tests && values.tests.length > 0 ? (
                        values.tests.map((test, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Test Name
                                </label>
                                <Field
                                  type="text"
                                  name={`tests.${index}.testName`}
                                  placeholder="e.g., Hemoglobin"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <ErrorMessage
                                  name={`tests.${index}.testName`}
                                  component="p"
                                  className="text-red-500 text-sm mt-1"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Value
                                </label>
                                <Field
                                  type="text"
                                  name={`tests.${index}.value`}
                                  placeholder="e.g., 13.5"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Units
                                </label>
                                <Field
                                  type="text"
                                  name={`tests.${index}.units`}
                                  placeholder="e.g., g/dL"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Reference Range
                                </label>
                                <Field
                                  type="text"
                                  name={`tests.${index}.referenceRange`}
                                  placeholder="e.g., 12-16"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div className="md:col-span-2 flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Field
                                    type="checkbox"
                                    name={`tests.${index}.flagged`}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Flag as abnormal
                                  </span>
                                </label>
                              </div>
                            </div>

                            {values.tests.length > 1 && (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => arrayHelpers.remove(index)}
                                  className="text-red-600 hover:text-red-800 flex items-center gap-2"
                                >
                                  <Trash2 size={18} /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          arrayHelpers.push({
                            testName: '',
                            value: '',
                            units: '',
                            referenceRange: '',
                            flagged: false,
                          })
                        }
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
                      >
                        <Plus size={18} /> Add Test
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 border-t pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Lab Result'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/lab-results')}
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