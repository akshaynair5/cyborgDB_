import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [currentLabTest, setCurrentLabTest] = useState(null);
  const [currentImagingStudy, setCurrentImagingStudy] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser, token) => {
    setUser(newUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        hospital,
        isLoading,
        login,
        logout,
        setHospital,
        currentPatient,
        setCurrentPatient,
        currentEncounter,
        setCurrentEncounter,
        currentPrescription,
        setCurrentPrescription,
        currentAppointment,
        setCurrentAppointment,
        currentLabTest,
        setCurrentLabTest,
        currentImagingStudy,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* ✅ THIS EXPORT IS CRITICAL */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
