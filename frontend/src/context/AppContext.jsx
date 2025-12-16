import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentEncounter, setCurrentEncounter] = useState(null);

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

  // ✅ ROLE HELPERS
  const role = user?.role;
  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';
  const isStaff = role === 'staff';

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        isDoctor,
        isNurse,
        isStaff,
        hospital,
        isLoading,
        login,
        logout,
        setHospital,
        currentPatient,
        setCurrentPatient,
        currentEncounter,
        setCurrentEncounter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
