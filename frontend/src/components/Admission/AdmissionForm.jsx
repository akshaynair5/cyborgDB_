import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft } from 'lucide-react';

const admissionSchema = Yup.object().shape({
  patient: Yup.string().required('Patient is required'),
  admissionReason: Yup.string().required('Admission reason is required'),
  ward: Yup.string(),
  room: Yup.string(),
  primaryConsultant: Yup.string(),
});

export const AdmissionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useApp();
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(!!id);

  // Fetch patients and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, usersRes] = await Promise.all([
          api.getPatients(user?.hospital || ''),
          api.getUsers(user.hospital || ''),
        ]);
        setPatients(patientsRes.data.message.patients || []);
        setUsers(usersRes.data.message.users || []);
      } catch (error) {
        toast.error('Failed to fetch data');
      }
    };
    fetchData();
  }, [user?.hospital]);

  // Fetch admission for edit
  useEffect(() => {
    if (!id) return;

    const fetchAdmission = async () => {
      try {
        const res = await api.getAdmissionById(id);
        const data = res.data.message.admission;

        setAdmission({
          encounter: data?.encounter || '',
          patient: data?.patient?._id || '',
          admissionReason: data?.admissionReason || '',
          ward: data?.ward || '',
          room: data?.room || '',
          primaryConsultant: data?.primaryConsultant?._id || '',
          admittedBy: data?.admittedBy?._id || user?._id || '',
        });

        if (data?.patient?._id) {
          fetchEncounters(data.patient._id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch admission');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmission();
  }, [id, user?._id]);

  // Fetch encounters for a patient
  const fetchEncounters = async (patientId) => {
    if (!patientId) return setEncounters([]);
    try {
      const res = await api.getEncountersForPatient(patientId);
      const list = res?.data?.message?.encounters || res?.data?.encounters || res?.data || [];
      setEncounters(list);
    } catch (err) {
      console.error(err);
      setEncounters([]);
    }
  };

  const handleSubmit = async (values) => {
    try {
      values.hospital = user?.hospital;
      if (id) {
        await api.updateAdmission(id, values);
        toast.success('Admission updated successfully');
      } else {
        await api.createAdmission(values);
        toast.success('Admission created successfully');
      }
      navigate('/admissions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save admission');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admissions')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Admission</h1>

        <Formik
          initialValues={{
            encounter: admission?.encounter || '',
            patient: admission?.patient || '',
            admissionReason: admission?.admissionReason || '',
            ward: admission?.ward || '',
            room: admission?.room || '',
            primaryConsultant: admission?.primaryConsultant || '',
            admittedBy: admission?.admittedBy || user?._id || '',
          }}
          validationSchema={admissionSchema}
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
                          fetchEncounters(e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a patient</option>
                        {patients.length > 0 && patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.firstName} {p.lastName} ({p.hospitalId})
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <ErrorMessage name="patient" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Encounter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link to Encounter (optional)</label>
                  <Field as="select" name="encounter" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">No encounter</option>
                    {encounters.length > 0 && encounters.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.reason ? `${e.reason} — ` : ''}
                        {e.startedAt ? new Date(e.startedAt).toLocaleString() : (e.createdAt ? new Date(e.createdAt).toLocaleString() : 'Encounter')}
                      </option>
                    ))}
                  </Field>
                </div>

                {/* Primary Consultant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Consultant</label>
                  <Field as="select" name="primaryConsultant" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select consultant</option>
                    {users.length > 0 && users.map((u) => (
                      <option key={u._id} value={u._id}>
                        Dr. {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </Field>
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
                  <Field type="text" name="ward" placeholder="Enter ward" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                  <Field type="text" name="room" placeholder="Enter room number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Admission Reason */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admission Reason</label>
                  <Field as="textarea" name="admissionReason" rows={4} placeholder="Enter reason for admission" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <ErrorMessage name="admissionReason" component="p" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Admission'}
                </button>
                <button type="button" onClick={() => navigate('/admissions')} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition">
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
