import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

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

  // Auth
  login(email, password) {
    return this.client.post('/auth/login', { email, password });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Users
  getUsers() {
    return this.client.get('/users');
  }

  createUser(data) {
    return this.client.post('/users', data);
  }

  updateUser(id, data) {
    return this.client.put(`/users/${id}`, data);
  }

  deleteUser(id) {
    return this.client.delete(`/users/${id}`);
  }

  // Patients
  getPatients(hospitalId) {
    return this.client.get(`/patients`, { params: { hospital: hospitalId } });
  }

  getPatient(id) {
    return this.client.get(`/patients/${id}`);
  }

  createPatient(data) {
    return this.client.post('/patients', data);
  }

  updatePatient(id, data) {
    return this.client.put(`/patients/${id}`, data);
  }

  deletePatient(id) {
    return this.client.delete(`/patients/${id}`);
  }

  searchPatients(query, hospitalId) {
    return this.client.get('/patients/search', { params: { q: query, hospital: hospitalId } });
  }

  // Admissions
  getAdmissions(hospitalId) {
    return this.client.get('/admissions', { params: { hospital: hospitalId } });
  }

  getAdmission(id) {
    return this.client.get(`/admissions/${id}`);
  }

  createAdmission(data) {
    return this.client.post('/admissions', data);
  }

  updateAdmission(id, data) {
    return this.client.put(`/admissions/${id}`, data);
  }

  dischargePatient(id, data) {
    return this.client.post(`/admissions/${id}/discharge`, data);
  }

  // Encounters
  getEncounters(patientId) {
    return this.client.get('/encounters', { params: { patient: patientId } });
  }

  getEncounter(id) {
    return this.client.get(`/encounters/${id}`);
  }

  createEncounter(data) {
    return this.client.post('/encounters', data);
  }

  updateEncounter(id, data) {
    return this.client.put(`/encounters/${id}`, data);
  }

  // Prescriptions
  getPrescriptions(patientId) {
    return this.client.get('/prescriptions', { params: { patient: patientId } });
  }

  createPrescription(data) {
    return this.client.post('/prescriptions', data);
  }

  updatePrescription(id, data) {
    return this.client.put(`/prescriptions/${id}`, data);
  }

  // Lab Results
  getLabResults(patientId) {
    return this.client.get('/lab-results', { params: { patient: patientId } });
  }

  createLabResult(data) {
    return this.client.post('/lab-results', data);
  }

  updateLabResult(id, data) {
    return this.client.put(`/lab-results/${id}`, data);
  }

  // Imaging
  getImagingReports(patientId) {
    return this.client.get('/imaging-reports', { params: { patient: patientId } });
  }

  createImagingReport(data) {
    return this.client.post('/imaging-reports', data);
  }

  // Diagnoses
  getDiagnoses(hospitalId) {
    return this.client.get('/diagnoses', { params: { hospital: hospitalId } });
  }

  createDiagnosis(data) {
    return this.client.post('/diagnoses', data);
  }
}

export default new APIClient();