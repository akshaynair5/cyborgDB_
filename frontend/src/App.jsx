import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from "./context/AppContext";
import { Toaster } from 'react-hot-toast';

// Auth
import { Login } from './components/Auth/Login';

// Layout
import Layout from './components/Common/Layout';

/* ===========================
   Lazy Loaded Pages
=========================== */

// Dashboard
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
);

// Patients
const PatientList = lazy(() =>
  import('./components/Patient/PatientList').then(m => ({ default: m.PatientList }))
);
const PatientForm = lazy(() =>
  import('./components/Patient/PatientForm').then(m => ({ default: m.PatientForm }))
);
const PatientDetail = lazy(() =>
  import('./components/Patient/PatientDetail').then(m => ({ default: m.PatientDetail }))
);

// Admissions
const AdmissionList = lazy(() =>
  import('./components/Admission/AdmissionList').then(m => ({ default: m.AdmissionList }))
);
const AdmissionForm = lazy(() =>
  import('./components/Admission/AdmissionForm').then(m => ({ default: m.AdmissionForm }))
);

// Encounters
const EncounterList = lazy(() =>
  import('./components/Encounter/EncounterList').then(m => ({ default: m.EncounterList }))
);
const EncounterForm = lazy(() =>
  import('./components/Encounter/EncounterForm').then(m => ({ default: m.EncounterForm }))
);
const EncounterDetail = lazy(() =>
  import('./components/Encounter/EncounterDetail').then(m => ({ default: m.EncounterDetail }))
);

// Search
const CyborgSearch = lazy(() =>
  import('./pages/CyborgSearch').then(m => ({ default: m.CyborgSearch }))
);
const LocalSearch = lazy(() =>
  import('./pages/LocalSearch').then(m => ({ default: m.LocalSearch }))
);

// Prescriptions
const PrescriptionList = lazy(() =>
  import('./components/Prescription/PrescriptionList').then(m => ({ default: m.PrescriptionList }))
);
const PrescriptionForm = lazy(() =>
  import('./components/Prescription/PrescriptionForm').then(m => ({ default: m.PrescriptionForm }))
);

// Lab Results
const LabResultList = lazy(() =>
  import('./components/LabResult/LabResultList').then(m => ({ default: m.LabResultList }))
);
const LabResultForm = lazy(() =>
  import('./components/LabResult/LabResultForm').then(m => ({ default: m.LabResultForm }))
);

// Imaging
const ImagingList = lazy(() =>
  import('./components/Imaging/ImagingList').then(m => ({ default: m.ImagingList }))
);
const ImagingForm = lazy(() =>
  import('./components/Imaging/ImagingForm').then(m => ({ default: m.ImagingForm }))
);

const Profile = lazy(() =>
  import('./pages/Profile').then(m => ({ default: m.Profile }))
);

/* ===========================
   Loaders
=========================== */

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <LoadingSpinner message="Loading application..." />
  </div>
);

/* ===========================
   Protected Route
=========================== */

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useApp();

  if (isLoading) return <FullPageLoader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        {children}
      </Suspense>
    </Layout>
  );
};

/* ===========================
   Route Configuration
=========================== */

const routeConfig = [
  { path: '/dashboard', element: <Dashboard />, roles: [] },

  // Patients
  { path: '/patients', element: <PatientList />, roles: [] },
  { path: '/patients/new', element: <PatientForm />, roles: ['admin', 'doctor', 'nurse'] },
  { path: '/patients/:id', element: <PatientDetail />, roles: [] },
  { path: '/patients/:id/edit', element: <PatientForm />, roles: ['admin', 'doctor', 'nurse'] },

  // Admissions
  { path: '/admissions', element: <AdmissionList />, roles: [] },
  { path: '/admissions/new', element: <AdmissionForm />, roles: ['admin', 'doctor', 'nurse'] },
  { path: '/admissions/:id/edit', element: <AdmissionForm />, roles: ['admin', 'doctor', 'nurse'] },

  // Encounters
  { path: '/encounters', element: <EncounterList />, roles: [] },
  { path: '/encounters/new', element: <EncounterForm />, roles: ['admin', 'doctor'] },
  { path: '/encounters/:id', element: <EncounterDetail />, roles: [] },
  { path: '/encounters/:id/edit', element: <EncounterForm />, roles: ['admin', 'doctor'] },

  // Search
  { path: '/search', element: <CyborgSearch />, roles: [] },
  { path: '/search/local', element: <LocalSearch />, roles: [] },

  // Prescriptions
  { path: '/prescriptions', element: <PrescriptionList />, roles: [] },
  { path: '/prescriptions/new', element: <PrescriptionForm />, roles: ['admin', 'doctor'] },
  { path: '/prescriptions/:id/edit', element: <PrescriptionForm />, roles: ['admin', 'doctor'] },

  // Lab Results
  { path: '/lab-results', element: <LabResultList />, roles: [] },
  { path: '/lab-results/new', element: <LabResultForm />, roles: ['admin', 'doctor', 'lab_tech'] },
  { path: '/lab-results/:id/edit', element: <LabResultForm />, roles: ['admin', 'doctor', 'lab_tech'] },

  // Imaging
  { path: '/imaging-reports', element: <ImagingList />, roles: [] },
  { path: '/imaging-reports/new', element: <ImagingForm />, roles: ['admin', 'doctor', 'radiologist'] },
  { path: '/imaging-reports/:id/edit', element: <ImagingForm />, roles: ['admin', 'doctor', 'radiologist'] },

  // Profile
  { path: '/profile', element: <Profile />, roles: ['admin', 'doctor', 'nurse'] },
];

/* ===========================
   App Content
=========================== */

function AppContent() {
  const { user, isLoading } = useApp();

  if (isLoading) return <FullPageLoader />;

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />

      {routeConfig.map(({ path, element, roles }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute allowedRoles={roles}>
              {element}
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="*"
        element={
          <ProtectedRoute>
            <div className="flex items-center justify-center min-h-[60vh] text-center">
              <h2 className="text-2xl font-bold">Page Not Found</h2>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

/* ===========================
   App Root
=========================== */

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
