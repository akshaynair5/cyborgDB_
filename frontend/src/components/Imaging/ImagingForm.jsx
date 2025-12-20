import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { ArrowLeft } from 'lucide-react';

const imagingSchema = Yup.object().shape({
  patient: Yup.string().required('Patient is required'),
  imagingType: Yup.string().required('Imaging type is required'),
  report: Yup.string(),
});

export const ImagingForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useApp();
  const [patients, setPatients] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [imaging, setImaging] = useState(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const pid = imaging?.patient || null;
    if (pid) fetchEncountersForPatient(pid);
  }, [imaging]);

  useEffect(() => {
    if (id) fetchImaging();
  }, [id]);

  const fetchPatients = async () => {
    try {
      const res = await api.getPatients(user?.hospital || '');
      const pts = res?.data?.message?.patients || res?.data?.patients || res?.data || [];
      setPatients(pts);
    } catch (err) {
      toast.error('Failed to fetch patients');
    }
  };

  const fetchImaging = async () => {
    try {
      const res = await api.getImagingReportById(id);
      // defensive extraction
      const payload = res?.data?.message?.imagingReport || res?.data?.imagingReport || res?.data || null;
      if (payload) setImaging(payload);
    } catch (err) {
      toast.error('Failed to fetch imaging record');
    } finally {
      setLoading(false);
    }
  };

  const fetchEncountersForPatient = async (patientId) => {
    try {
      const res = await api.getEncountersForPatient(patientId);
      const all = res?.data?.message?.encounters || res?.data?.encounters || res?.data || [];
      setEncounters(all);
    } catch (err) {
      setEncounters([]);
    }
  };

  const initialValues = imaging || {
    patient: '',
    encounter: '',
    imagingType: '',
    modality: '',
    report: '',
    resultSummary: '',
    performedBy: user?._id || '',
  };

  const handleSubmit = async (values) => {
    try {
      values.hospital = user?.hospital;
      if (id) {
        await api.updateImagingReport(id, values);
        toast.success('Imaging report updated successfully');
      } else {
        const res = await api.createImagingReport(values);
        console.log(res.data);
        toast.success('Imaging report created successfully');
      }
      navigate('/imaging-reports');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save imaging report');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/imaging-reports')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'New'} Imaging Report</h1>

        <Formik initialValues={initialValues} validationSchema={imagingSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <Field name="patient">
                    {({ field, form }) => (
                      <select
                        {...field}
                        onChange={(e) => {
                          form.setFieldValue('patient', e.target.value);
                          form.setFieldValue('encounter', '');
                          fetchEncountersForPatient(e.target.value);
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link to Encounter (optional)</label>
                  <Field as="select" name="encounter" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">No encounter</option>
                    {encounters.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.reason ? `${e.reason} — ` : ''}{e.startedAt ? new Date(e.startedAt).toLocaleString() : (e.createdAt ? new Date(e.createdAt).toLocaleString() : 'Encounter')}
                      </option>
                    ))}
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imaging Type</label>
                  <Field type="text" name="imagingType" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Chest X-ray, CT Abdomen" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modality</label>
                  <Field
                    as="select"
                    name="modality"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a Modality</option>
                    <option value="XRAY">XRAY</option>
                    <option value="USG">USG</option>
                    <option value="CT">CT</option>
                    <option value="MRI">MRI</option>
                    <option value="ECG">ECG</option>
                    <option value="OTHER">OTHER</option>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report</label>
                  <Field as="textarea" name="report" rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detailed report..." />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Result Summary</label>
                  <Field type="text" name="resultSummary" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Short summary for dashboard" />
                </div>
              </div>

              <div className="flex gap-4 border-t pt-6">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Imaging Report'}
                </button>
                <button type="button" onClick={() => navigate('/imaging-reports')} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition">
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

export default ImagingForm;
