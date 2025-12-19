import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Lock, Mail } from 'lucide-react';
import Select from 'react-select';

// --------------------- VALIDATION SCHEMAS ---------------------
const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email required'),
  password: Yup.string().min(6).required('Password required'),
});

const registerSchema = Yup.object().shape({
  firstName: Yup.string().required('First name required'),
  lastName: Yup.string().required('Last name required'),
  email: Yup.string().email('Invalid email').required('Email required'),
  password: Yup.string().min(6).required('Password required'),
  role: Yup.string().required('Role required'),
  hospital: Yup.object()
  .shape({
    value: Yup.string().required(),
    label: Yup.string().required()
  })
  .required("Hospital is required"),
});


// ------------------------- COMPONENT --------------------------
export const Login = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const [hospitals, setHospitals] = useState([]);

  // Fetch hospitals (only when register screen opens)
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const res = await api.getHospitals();
        const formatted = res.data.message.hospitals.map(h => ({
          value: h._id,
          label: h.name,
        }));
        console.log('Hospitals:', formatted);
        setHospitals(formatted);
      } catch (err) {
        console.error('Failed to load hospitals:', err);
      }
    };

    if (isRegister) loadHospitals();
  }, [isRegister]);

  // ------------------------ LOGIN ------------------------
  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.loginUser(values.email, values.password);
      console.log('Login response:', response);
      const user = response.data.message.user;
      const token = response.data.message.accessToken;

      login(user, token);
      toast.success('Login successful');
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  // ------------------------ REGISTER ------------------------
  const handleRegister = async (values) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        hospital: values.hospital?.value || undefined, 
      };
      console.log('Register payload:', payload);
      try{
        await api.registerUser(payload);
        toast.success("Registration successful");
        navigate('/login');
      }
      catch(err){
        console.error('Registration error:', err);
        throw err;
      }
      setIsRegister(false);

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Registration failed');

    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------ UI ------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hospital Management</h1>
          <p className="text-gray-500 mt-2">
            {isRegister ? 'Create an account' : 'Sign in to your account'}
          </p>
        </div>

        {/* ---------------------- LOGIN FORM ---------------------- */}
        {!isRegister ? (
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {() => (
              <Form>
                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <Field
                      type="email"
                      name="email"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      placeholder="you@example.com"
                    />
                  </div>
                  <ErrorMessage name="email" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <Field
                      type="password"
                      name="password"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      placeholder="••••••••"
                    />
                  </div>
                  <ErrorMessage name="password" component="p" className="text-red-500 text-sm mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                <p className="text-center mt-4 text-sm text-gray-600">
                  Don’t have an account?
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-blue-700 ml-1 underline"
                  >
                    Register
                  </button>
                </p>
              </Form>
            )}
          </Formik>
        ) : (
        /* ---------------------- REGISTER FORM ---------------------- */
          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              role: '',
              hospital: null,
            }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
          >
            {({ setFieldValue, values }) => (
              <Form>
                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <Field name="firstName" className="w-full border rounded p-2" />
                    <ErrorMessage name="firstName" component="p" className="text-red-500 text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <Field name="lastName" className="w-full border rounded p-2" />
                    <ErrorMessage name="lastName" component="p" className="text-red-500 text-sm" />
                  </div>
                </div>

                {/* Email */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Field name="email" type="email" className="w-full border rounded p-2" />
                  <ErrorMessage name="email" component="p" className="text-red-500 text-sm" />
                </div>

                {/* Password */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Field name="password" type="password" className="w-full border rounded p-2" />
                  <ErrorMessage name="password" component="p" className="text-red-500 text-sm" />
                </div>

                {/* Role */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Field as="select" name="role" className="w-full border rounded p-2">
                    <option value="">Select Role</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="staff">Staff</option>
                  </Field>
                  <ErrorMessage name="role" component="p" className="text-red-500 text-sm" />
                </div>

                {/* Hospital (Searchable Dropdown) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Hospital (Optional)</label>
                  <Select
                    options={hospitals}
                    isSearchable
                    isClearable
                    placeholder="Search and select hospital..."
                    value={values.hospital}
                    onChange={(option) => setFieldValue('hospital', option)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg mt-6 disabled:opacity-50"
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>

                <p className="text-center mt-4 text-sm text-gray-600">
                  Already have an account?
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-blue-700 ml-1 underline"
                  >
                    Login
                  </button>
                </p>

              </Form>
            )}
          </Formik>
        )}

      </div>
    </div>
  );
};
