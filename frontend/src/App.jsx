import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from "./context/AppContext";
import { Toaster } from 'react-hot-toast';

import { Login } from './components/Auth/Login';

// Dashboard
import { Dashboard } from './pages/Dashboard';

// Patient
import { PatientList } from './components/Patient/PatientList';
import { PatientForm } from './components/Patient/PatientForm';
import { PatientDetail } from './components/Patient/PatientDetail';

// Admissions
import { AdmissionList } from './components/Admission/AdmissionList';
import { AdmissionForm } from './components/Admission/AdmissionForm';

// Encounters
import { EncounterForm } from './components/Encounter/EncounterForm';

// Prescriptions
import { PrescriptionForm } from './components/Prescription/PrescriptionForm';
import { PrescriptionList } from './components/Prescription/PrescriptionList';

// Lab Results
import { LabResultForm } from './components/LabResult/LabResultForm';
import { LabResultList } from './components/LabResult/LabResultList';

// Imaging
import { ImagingList } from './components/Imaging/ImagingList';

import Layout from './components/Common/Layout';


// 🔒 Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};


function AppContent() {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Patients */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/new"
        element={
          <ProtectedRoute>
            <PatientForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <PatientDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id/edit"
        element={
          <ProtectedRoute>
            <PatientForm />
          </ProtectedRoute>
        }
      />

      {/* Admissions */}
      <Route
        path="/admissions"
        element={
          <ProtectedRoute>
            <AdmissionList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admissions/new"
        element={
          <ProtectedRoute>
            <AdmissionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admissions/:id/edit"
        element={
          <ProtectedRoute>
            <AdmissionForm />
          </ProtectedRoute>
        }
      />

      {/* Encounters */}
      <Route
        path="/encounters/new"
        element={
          <ProtectedRoute>
            <EncounterForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/encounters/:id/edit"
        element={
          <ProtectedRoute>
            <EncounterForm />
          </ProtectedRoute>
        }
      />

      {/* Prescriptions */}
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <PrescriptionList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/new"
        element={
          <ProtectedRoute>
            <PrescriptionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/:id/edit"
        element={
          <ProtectedRoute>
            <PrescriptionForm />
          </ProtectedRoute>
        }
      />

      {/* Lab Results */}
      <Route
        path="/lab-results"
        element={
          <ProtectedRoute>
            <LabResultList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab-results/new"
        element={
          <ProtectedRoute>
            <LabResultForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab-results/:id/edit"
        element={
          <ProtectedRoute>
            <LabResultForm />
          </ProtectedRoute>
        }
      />

      {/* Imaging */}
      <Route
        path="/imaging-reports"
        element={
          <ProtectedRoute>
            <ImagingList />
          </ProtectedRoute>
        }
      />

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}


function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
        <Toaster position="top-right" />
      </Router>
    </AppProvider>
  );
}

export default App;