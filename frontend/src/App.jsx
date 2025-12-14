import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from "./context/AppContext";
import { Toaster } from 'react-hot-toast';

// Auth
import { Login } from './components/Auth/Login';

// Layout
import Layout from './components/Common/Layout';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

// Patient
const PatientList = lazy(() => import('./components/Patient/PatientList').then(m => ({ default: m.PatientList })));
const PatientForm = lazy(() => import('./components/Patient/PatientForm').then(m => ({ default: m.PatientForm })));
const PatientDetail = lazy(() => import('./components/Patient/PatientDetail').then(m => ({ default: m.PatientDetail })));

// Admissions
const AdmissionList = lazy(() => import('./components/Admission/AdmissionList').then(m => ({ default: m.AdmissionList })));
const AdmissionForm = lazy(() => import('./components/Admission/AdmissionForm').then(m => ({ default: m.AdmissionForm })));

// Encounters
const EncounterForm = lazy(() => import('./components/Encounter/EncounterForm').then(m => ({ default: m.EncounterForm })));
const EncounterList = lazy(() => import('./components/Encounter/EncounterList').then(m => ({ default: m.EncounterList })));
const EncounterDetail = lazy(() => import('./components/Encounter/EncounterDetail').then(m => ({ default: m.EncounterDetail })));
// Cyborg Search
const CyborgSearch = lazy(() => import('./pages/CyborgSearch').then(m => ({ default: m.CyborgSearch })));
const LocalSearch = lazy(() => import('./pages/LocalSearch').then(m => ({ default: m.LocalSearch })));

// Prescriptions
const PrescriptionForm = lazy(() => import('./components/Prescription/PrescriptionForm').then(m => ({ default: m.PrescriptionForm })));
const PrescriptionList = lazy(() => import('./components/Prescription/PrescriptionList').then(m => ({ default: m.PrescriptionList })));

// Lab Results
const LabResultForm = lazy(() => import('./components/LabResult/LabResultForm').then(m => ({ default: m.LabResultForm })));
const LabResultList = lazy(() => import('./components/LabResult/LabResultList').then(m => ({ default: m.LabResultList })));

// Imaging
const ImagingList = lazy(() => import('./components/Imaging/ImagingList').then(m => ({ default: m.ImagingList })));
const ImagingForm = lazy(() => import('./components/Imaging/ImagingForm').then(m => ({ default: m.ImagingForm })));

// Settings & Profile
const Settings = lazy(() => import('./pages/settings').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

// 🎯 Loading Spinner Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

// 🎯 Full Page Loading
const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-800">Hospital Management System</h2>
      <p className="text-gray-500 mt-2">Loading application...</p>
    </div>
  </div>
);

// 🎯 Error Boundary Fallback
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center p-8 bg-red-50 rounded-xl max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
      <p className="text-red-600 text-sm mb-4">{error?.message || "An unexpected error occurred"}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

// 🔒 Protected Route Wrapper with Role-based Access
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 bg-yellow-50 rounded-xl max-w-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m-4.93 0a8 8 0 1113.86 0" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h3>
            <p className="text-yellow-600 text-sm mb-4">
              You don't have permission to access this page. Contact your administrator if you believe this is an error.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
        {children}
      </Suspense>
    </Layout>
  );
};

// 🎯 Route Configuration
const routeConfig = [
  // Dashboard
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

  // Cyborg natural language search
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
  
  // Settings & Profile
  { path: '/settings', element: <Settings />, roles: ['admin'] },
  { path: '/profile', element: <Profile />, roles: [] },
];

function AppContent() {
  const { user, isLoading } = useApp();

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
      />

      {/* Dynamic Protected Routes */}
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

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={
        <ProtectedRoute>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8">
              <div className="text-8xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
              <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '10px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AppProvider>
  );
}

export default App;