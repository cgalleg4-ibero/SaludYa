import { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfile } from './components/UserProfile';
import { AppointmentSearch } from './components/AppointmentSearch';
import { AppointmentCalendar } from './components/AppointmentCalendar';
import { clearToken, getProfile, saveToken } from './api';

type View = 'login' | 'register' | 'dashboard' | 'appointment-search' | 'appointment-calendar' | 'profile';
type UserType = 'patient' | 'doctor' | 'admin';

type User = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  role: UserType;
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [token, setToken] = useState<string | null>(localStorage.getItem('saludya_token'));
  const [user, setUser] = useState<User | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setCurrentView('login');
      setUser(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);
        setCurrentView('dashboard');
      } catch (error) {
        clearToken();
        setToken(null);
        setUser(null);
        setCurrentView('login');
      }
    };

    if (!user) {
      loadProfile();
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, profile: User) => {
    saveToken(newToken);
    setToken(newToken);
    setUser(profile);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setUser(null);
    setCurrentView('login');
  };

  const handleNewAppointment = () => {
    setCurrentView('appointment-search');
  };

  const handleSelectDoctor = (doctorId: string, doctorName: string) => {
    setSelectedDoctor({ id: doctorId, name: doctorName });
    setCurrentView('appointment-calendar');
  };

  const handleViewProfile = () => {
    setCurrentView('profile');
  };

  if (!token || !user) {
    return (
      <div style={{ backgroundColor: 'var(--background)' }}>
        {currentView === 'login' ? (
          <Login
            onSwitchToRegister={() => setCurrentView('register')}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <Register onSwitchToLogin={() => setCurrentView('login')} />
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      {currentView === 'dashboard' && user.role === 'patient' && (
        <PatientDashboard
          user={user}
          onLogout={handleLogout}
          onNewAppointment={handleNewAppointment}
          onViewProfile={handleViewProfile}
        />
      )}
      {currentView === 'dashboard' && user.role === 'doctor' && (
        <DoctorDashboard
          doctorId={user._id}
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
        />
      )}
      {currentView === 'dashboard' && user.role === 'admin' && (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onViewProfile={handleViewProfile}
        />
      )}
      {currentView === 'profile' && (
        <UserProfile onBack={() => setCurrentView('dashboard')} />
      )}
      {currentView === 'appointment-search' && (
        <AppointmentSearch
          onBack={() => setCurrentView('dashboard')}
          onSelectDoctor={handleSelectDoctor}
        />
      )}
      {currentView === 'appointment-calendar' && selectedDoctor && (
        <AppointmentCalendar
          onBack={() => setCurrentView('appointment-search')}
          doctorId={selectedDoctor.id}
          doctorName={selectedDoctor.name}
        />
      )}
    </div>
  );
}
