import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Pill, TrendingUp, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PatientDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { currentPatient, setCurrentPatient } = useApp();
  const [patient, setPatient] = useState(currentPatient || location.state?.patient || null);
  const [encounters, setEncounters] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(!patient);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    // If we already have patient data from navigation, just fetch related data
    if (patient) {
      try {
        const [encountersRes, prescriptionsRes] = await Promise.all([
          api.getEncountersForPatient(id),
          api.getPrescriptionsForPatient(id),
        ]);

        const encountersPayload = encountersRes?.data?.data?.encounters || encountersRes?.data?.encounters || encountersRes?.data || [];
        const prescriptionsPayload = prescriptionsRes?.data?.data?.prescriptions || prescriptionsRes?.data?.prescriptions || prescriptionsRes?.data || [];

        setEncounters(encountersPayload);
        setPrescriptions(prescriptionsPayload);
      } catch (error) {
        console.error('Failed to fetch related data:', error);
        toast.error('Failed to fetch patient encounters/prescriptions');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Otherwise, fetch full patient data from API
    try {
      const [patientRes, encountersRes, prescriptionsRes] = await Promise.all([
        api.getPatientById(id),
        api.getEncountersForPatient(id),
        api.getPrescriptionsForPatient(id),
      ]);

      const patientPayload = patientRes?.data?.data?.patient || patientRes?.data?.patient || patientRes?.data || null;
      const encountersPayload = encountersRes?.data?.data?.encounters || encountersRes?.data?.encounters || encountersRes?.data || [];
      const prescriptionsPayload = prescriptionsRes?.data?.data?.prescriptions || prescriptionsRes?.data?.prescriptions || prescriptionsRes?.data || [];

      setPatient(patientPayload);
      setCurrentPatient(patientPayload);
      setEncounters(encountersPayload);
      setPrescriptions(prescriptionsPayload);
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
      toast.error('Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!patient) return <div className="text-center py-10">Patient not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <button
          onClick={() => navigate(`/patients/${id}/edit`)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Edit size={20} /> Edit
        </button>
      </div>

      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Name</p>
            <p className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">MRN</p>
            <p className="text-2xl font-bold text-gray-900">{patient.hospitalId}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">DOB</p>
            <p className="text-lg text-gray-900">{new Date(patient.dob).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-gray-600 text-sm">Gender</p>
            <p className="font-semibold text-gray-900 capitalize">{patient.gender}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Blood Group</p>
            <p className="font-semibold text-gray-900">{patient.bloodGroup || '-'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Phone</p>
            <p className="font-semibold text-gray-900">{patient.phone || '-'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Address</p>
            <p className="font-semibold text-gray-900">{patient.address ? patient.address.substring(0, 20) + '...' : '-'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          {['overview', 'encounters', 'prescriptions', 'allergies'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition ${
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
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                <p className="text-gray-600">{patient.address || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Chronic Conditions</h3>
                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronicConditions.map((condition, i) => (
                      <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No chronic conditions</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'encounters' && (
            <div className="space-y-3">
              {encounters.length > 0 ? (
                encounters.map((enc) => (
                  <div key={enc._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{enc.encounterType}</p>
                        <p className="text-sm text-gray-600">{new Date(enc.startedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {enc.encounterType}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No encounters</p>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-3">
              {prescriptions.length > 0 ? (
                prescriptions.map((rx) => (
                  <div key={rx._id} className="border rounded-lg p-4">
                    <p className="font-semibold text-gray-900 mb-2">
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </p>
                    <div className="space-y-1">
                      {rx.items.map((item, i) => (
                        <p key={i} className="text-sm text-gray-600">
                          {item.name} - {item.dosage} {item.frequency}
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No prescriptions</p>
              )}
            </div>
          )}

          {activeTab === 'allergies' && (
            <div>
              {patient.allergies && patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, i) => (
                    <span key={i} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No allergies recorded</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};