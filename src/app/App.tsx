import { useState } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { UserProfile } from './components/UserProfile';
import { AppointmentSearch } from './components/AppointmentSearch';
import { AppointmentCalendar } from './components/AppointmentCalendar';

type View = 'login' | 'register' | 'dashboard' | 'appointment-search' | 'appointment-calendar' | 'profile';
type UserType = 'patient' | 'doctor';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<UserType>('patient');
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);

  const handleLogin = (type: UserType) => {
    setIsAuthenticated(true);
    setUserType(type);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: 'var(--background)' }}>
        {currentView === 'login' ? (
          <Login
            onSwitchToRegister={() => setCurrentView('register')}
            onLoginSuccess={handleLogin}
          />
        ) : (
          <Register onSwitchToLogin={() => setCurrentView('login')} />
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--background)' }}>
      {currentView === 'dashboard' && userType === 'patient' && (
        <PatientDashboard
          onLogout={handleLogout}
          onNewAppointment={handleNewAppointment}
          onViewProfile={handleViewProfile}
        />
      )}
      {currentView === 'dashboard' && userType === 'doctor' && (
        <DoctorDashboard
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
          onSelectDoctor={(doctorId) => {
            const doctors = [
              { id: '1', name: 'Dra. María González' },
              { id: '2', name: 'Dr. Carlos Ramírez' },
              { id: '3', name: 'Dra. Ana Martínez' },
              { id: '4', name: 'Dr. Roberto Silva' },
              { id: '5', name: 'Dra. Laura Fernández' },
              { id: '6', name: 'Dr. Pedro López' }
            ];
            const doctor = doctors.find(d => d.id === doctorId);
            if (doctor) {
              handleSelectDoctor(doctor.id, doctor.name);
            }
          }}
        />
      )}
      {currentView === 'appointment-calendar' && selectedDoctor && (
        <AppointmentCalendar
          onBack={() => setCurrentView('appointment-search')}
          doctorName={selectedDoctor.name}
        />
      )}
    </div>
  );
}
