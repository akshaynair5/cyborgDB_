import axios from 'axios';

// Base URL from Vite environment OR default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach JWT to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Auto-logout on 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /* --------------------------------------------------------------------------
   * AUTH + USERS
   * Backend Routes:
   * POST /users/register
   * POST /users/login
   * POST /users/logout
   * GET /users
   * GET /users/:id
   * PATCH /users/:id
   * DELETE /users/:id
   * -------------------------------------------------------------------------- */

  registerUser(data) {
    return this.client.post('/users/register', data);
  }

  loginUser(email, password) {
    return this.client.post('/users/login', { email, password });
  }

  logoutUser() {
    return this.client.post('/users/logout');
  }

  getUsers() {
    return this.client.get('/users');
  }

  getUserById(id) {
    return this.client.get(`/users/${id}`);
  }

  updateUser(id, data) {
    return this.client.patch(`/users/${id}`, data);
  }

  deleteUser(id) {
    return this.client.delete(`/users/${id}`);
  }

  /* --------------------------------------------------------------------------
   * PATIENTS
   * Backend Routes:
   * POST /patients
   * GET /patients
   * GET /patients/:id
   * PATCH /patients/:id
   * DELETE /patients/:id
   * -------------------------------------------------------------------------- */

  getPatients() {
    return this.client.get('/patients');
  }

  getPatientById(id) {
    return this.client.get(`/patients/${id}`);
  }

  createPatient(data) {
    return this.client.post('/patients', data);
  }

  updatePatient(id, data) {
    return this.client.patch(`/patients/${id}`, data);
  }

  deletePatient(id) {
    return this.client.delete(`/patients/${id}`);
  }

  /* --------------------------------------------------------------------------
   * ADMISSIONS
   * Backend Routes:
   * POST /admissions
   * GET /admissions
   * GET /admissions/:id
   * PATCH /admissions/:id
   * DELETE /admissions/:id
   * POST /admissions/:id/discharge
   * -------------------------------------------------------------------------- */

  getAdmissions() {
    return this.client.get('/admissions');
  }

  getAdmissionById(id) {
    return this.client.get(`/admissions/${id}`);
  }

  createAdmission(data) {
    return this.client.post('/admissions', data);
  }

  updateAdmission(id, data) {
    return this.client.patch(`/admissions/${id}`, data);
  }

  deleteAdmission(id) {
    return this.client.delete(`/admissions/${id}`);
  }

  dischargePatient(id, data) {
    return this.client.post(`/admissions/${id}/discharge`, data);
  }

  /* --------------------------------------------------------------------------
   * ENCOUNTERS
   * Backend:
   * POST /encounters
   * GET /encounters
   * GET /encounters/:id
   * PATCH /encounters/:id
   * DELETE /encounters/:id
   * -------------------------------------------------------------------------- */

  getEncounters() {
    return this.client.get('/encounters');
  }

  getEncounterById(id) {
    return this.client.get(`/encounters/${id}`);
  }

  createEncounter(data) {
    return this.client.post('/encounters', data);
  }

  updateEncounter(id, data) {
    return this.client.patch(`/encounters/${id}`, data);
  }

  deleteEncounter(id) {
    return this.client.delete(`/encounters/${id}`);
  }

  /* --------------------------------------------------------------------------
   * PRESCRIPTIONS
   * Backend:
   * POST /prescriptions
   * GET /prescriptions
   * GET /prescriptions/:id
   * PATCH /prescriptions/:id
   * DELETE /prescriptions/:id
   * -------------------------------------------------------------------------- */

  getPrescriptions() {
    return this.client.get('/prescriptions');
  }

  getPrescriptionById(id) {
    return this.client.get(`/prescriptions/${id}`);
  }

  createPrescription(data) {
    return this.client.post('/prescriptions', data);
  }

  updatePrescription(id, data) {
    return this.client.patch(`/prescriptions/${id}`, data);
  }

  deletePrescription(id) {
    return this.client.delete(`/prescriptions/${id}`);
  }

  /* --------------------------------------------------------------------------
   * LAB RESULTS
   * Backend:
   * POST /lab
   * GET /lab
   * GET /lab/:id
   * PATCH /lab/:id
   * DELETE /lab/:id
   * -------------------------------------------------------------------------- */

  getLabResults() {
    return this.client.get('/labs');
  }

  getLabResultById(id) {
    return this.client.get(`/labs/${id}`);
  }

  createLabResult(data) {
    return this.client.post('/labs', data);
  }

  updateLabResult(id, data) {
    return this.client.patch(`/labs/${id}`, data);
  }

  deleteLabResult(id) {
    return this.client.delete(`/labs/${id}`);
  }

  /* --------------------------------------------------------------------------
   * IMAGING REPORTS
   * Backend:
   * POST /imaging
   * GET /imaging
   * GET /imaging/:id
   * PATCH /imaging/:id
   * DELETE /imaging/:id
   * -------------------------------------------------------------------------- */

  getImagingReports() {
    return this.client.get('/imaging');
  }

  getImagingReportById(id) {
    return this.client.get(`/imaging/${id}`);
  }

  createImagingReport(data) {
    return this.client.post('/imaging', data);
  }

  updateImagingReport(id, data) {
    return this.client.patch(`/imaging/${id}`, data);
  }

  deleteImagingReport(id) {
    return this.client.delete(`/imaging/${id}`);
  }

  /* --------------------------------------------------------------------------
   * DIAGNOSIS
   * Backend:
   * POST /diagnosis
   * GET /diagnosis
   * GET /diagnosis/:id
   * PATCH /diagnosis/:id
   * DELETE /diagnosis/:id
   * -------------------------------------------------------------------------- */

  getDiagnoses() {
    return this.client.get('/diagnosis');
  }

  getDiagnosisById(id) {
    return this.client.get(`/diagnosis/${id}`);
  }

  createDiagnosis(data) {
    return this.client.post('/diagnosis', data);
  }

  updateDiagnosis(id, data) {
    return this.client.patch(`/diagnosis/${id}`, data);
  }

  deleteDiagnosis(id) {
    return this.client.delete(`/diagnosis/${id}`);
  }

  /* --------------------------------------------------------------------------
   * AUDIT LOGS
   * Backend:
   * GET /audit
   * GET /audit/:id
   * -------------------------------------------------------------------------- */

  getAuditLogs() {
    return this.client.get('/audit');
  }

  getAuditLogById(id) {
    return this.client.get(`/audit/${id}`);
  }

  /* --------------------------------------------------------------------------
   * HOSPITALS
   * Backend:
   * POST /hospitals
   * GET /hospitals
   * GET /hospitals/:id
   * PATCH /hospitals/:id
   * DELETE /hospitals/:id
   * -------------------------------------------------------------------------- */

  getHospitals() {
    return this.client.get('/hospitals');
  }

  getHospitalById(id) {
    return this.client.get(`/hospitals/${id}`);
  }

  createHospital(data) {
    return this.client.post('/hospitals', data);
  }

  updateHospital(id, data) {
    return this.client.patch(`/hospitals/${id}`, data);
  }

  deleteHospital(id) {
    return this.client.delete(`/hospitals/${id}`);
  }

  /* --------------------------------------------------------------------------
   * DASHBOARD
   * GET /dashboard/summary
   * GET /dashboard/trends?days=7
   * -------------------------------------------------------------------------- */

  getDashboardSummary() {
    return this.client.get('/dashboard/summary');
  }

  getDashboardTrends(days = 7) {
    return this.client.get(`/dashboard/trends?days=${days}`);
  }

  getDashboardOverview() {
    return this.client.get('/dashboard/overview');
  }

  getDashboardAnalytics() {
    return this.client.get('/dashboard/analytics');
  }

  getDashboardAlerts() {
    return this.client.get('/dashboard/alerts');
  }
}

export default new APIClient();
