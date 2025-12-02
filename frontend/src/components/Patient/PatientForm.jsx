import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Trash2 } from 'lucide-react';

const patientSchema = Yup.object().shape({
  hospitalId: Yup.string().required('MRN is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  dob: Yup.date().required('Date of birth is required'),
  gender: Yup.string().oneOf(['male', 'female', 'other', 'unknown']),
  phone: Yup.string(),
  address: Yup.string(),
  bloodGroup: Yup.string(),
});

export const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useApp();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      const response = await api.getPatient(id);
      setPatient(response.data);
    } catch (error) {
      toast.error('Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  };

  const initialValues = patient || {
    hospitalId: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'unknown',
    phone: '',
    address: '',
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    emergencyContacts: [{ name: '', relation: '', phone: '' }],
  };

  const handleSubmit = async (values) => {
    try {
      if (id) {
        await api.updatePatient(id, values);
        toast.success('Patient updated successfully');
      } else {
        values.hospital = user?.hospital;
        await api.createPatient(values);
        toast.success('Patient created successfully');
      }
      navigate('/patients');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save patient');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
      >
        <ArrowLeft size={20} /> Back to Patients
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Patient</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={patientSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRN (Medical Record Number)</label>
                  <Field
                    type="text"
                    name="hospitalId"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter MRN"
                  />
                  <ErrorMessage name="hospitalId" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <Field
                    type="text"
                    name="firstName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter first name"
                  />
                  <ErrorMessage name="firstName" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <Field
                    type="text"
                    name="lastName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last name"
                  />
                  <ErrorMessage name="lastName" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <Field
                    type="date"
                    name="dob"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <ErrorMessage name="dob" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <Field
                    as="select"
                    name="gender"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <Field
                    type="text"
                    name="bloodGroup"
                    placeholder="O+, A-, B+, AB+ etc"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <Field
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <Field
                    as="textarea"
                    name="address"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* Allergies Section */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Allergies</label>
                <FieldArray name="allergies">
                  {(arrayHelpers) => (
                    <div className="space-y-3">
                      {values.allergies && values.allergies.length > 0 ? (
                        values.allergies.map((_, index) => (
                          <div key={index} className="flex gap-2">
                            <Field
                              type="text"
                              name={`allergies.${index}`}
                              placeholder="Enter allergy (e.g., Penicillin)"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => arrayHelpers.remove(index)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No allergies added</p>
                      )}
                      <button
                        type="button"
                        onClick={() => arrayHelpers.push('')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Allergy
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Chronic Conditions Section */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Chronic Conditions</label>
                <FieldArray name="chronicConditions">
                  {(arrayHelpers) => (
                    <div className="space-y-3">
                      {values.chronicConditions && values.chronicConditions.length > 0 ? (
                        values.chronicConditions.map((_, index) => (
                          <div key={index} className="flex gap-2">
                            <Field
                              type="text"
                              name={`chronicConditions.${index}`}
                              placeholder="Enter condition (e.g., Diabetes)"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => arrayHelpers.remove(index)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No chronic conditions added</p>
                      )}
                      <button
                        type="button"
                        onClick={() => arrayHelpers.push('')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Condition
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              {/* Emergency Contacts Section */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Emergency Contacts</label>
                <FieldArray name="emergencyContacts">
                  {(arrayHelpers) => (
                    <div className="space-y-4">
                      {values.emergencyContacts && values.emergencyContacts.length > 0 ? (
                        values.emergencyContacts.map((_, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50">
                            <Field
                              type="text"
                              name={`emergencyContacts.${index}.name`}
                              placeholder="Name"
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Field
                              type="text"
                              name={`emergencyContacts.${index}.relation`}
                              placeholder="Relation"
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <Field
                                type="tel"
                                name={`emergencyContacts.${index}.phone`}
                                placeholder="Phone"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => arrayHelpers.remove(index)}
                                className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : null}
                      <button
                        type="button"
                        onClick={() => arrayHelpers.push({ name: '', relation: '', phone: '' })}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Emergency Contact
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
                  {isSubmitting ? 'Saving...' : 'Save Patient'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/patients')}
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