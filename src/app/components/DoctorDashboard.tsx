import { Calendar, Clock, User, LogOut, Settings, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DoctorDashboardProps {
  onLogout: () => void;
  onViewProfile: () => void;
}

interface Appointment {
  id: string;
  time: string;
  patient: {
    name: string;
    age: number;
    phone: string;
  };
  reason: string;
  status: 'pendiente' | 'en-progreso' | 'completada' | 'cancelada';
  duration: number;
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    time: '09:00',
    patient: {
      name: 'Juan Pérez',
      age: 41,
      phone: '5512345678'
    },
    reason: 'Consulta general - Control de hipertensión',
    status: 'completada',
    duration: 30
  },
  {
    id: '2',
    time: '09:30',
    patient: {
      name: 'María González',
      age: 35,
      phone: '5523456789'
    },
    reason: 'Revisión de resultados de laboratorio',
    status: 'completada',
    duration: 30
  },
  {
    id: '3',
    time: '10:00',
    patient: {
      name: 'Carlos Ramírez',
      age: 52,
      phone: '5534567890'
    },
    reason: 'Dolor de espalda crónico',
    status: 'en-progreso',
    duration: 30
  },
  {
    id: '4',
    time: '10:30',
    patient: {
      name: 'Ana Martínez',
      age: 28,
      phone: '5545678901'
    },
    reason: 'Consulta dermatológica - Revisión de lunar',
    status: 'pendiente',
    duration: 30
  },
  {
    id: '5',
    time: '11:00',
    patient: {
      name: 'Roberto Silva',
      age: 45,
      phone: '5556789012'
    },
    reason: 'Control de diabetes',
    status: 'pendiente',
    duration: 30
  },
  {
    id: '6',
    time: '11:30',
    patient: {
      name: 'Laura Fernández',
      age: 62,
      phone: '5567890123'
    },
    reason: 'Consulta cardiológica - Seguimiento',
    status: 'pendiente',
    duration: 30
  },
  {
    id: '7',
    time: '15:00',
    patient: {
      name: 'Pedro López',
      age: 38,
      phone: '5578901234'
    },
    reason: 'Gripe y malestar general',
    status: 'pendiente',
    duration: 20
  },
  {
    id: '8',
    time: '15:30',
    patient: {
      name: 'Sofia Torres',
      age: 25,
      phone: '5589012345'
    },
    reason: 'Consulta nutricional',
    status: 'pendiente',
    duration: 30
  }
];

export function DoctorDashboard({ onLogout, onViewProfile }: DoctorDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada':
        return 'var(--secondary)';
      case 'en-progreso':
        return 'var(--accent)';
      case 'pendiente':
        return 'var(--primary)';
      case 'cancelada':
        return 'var(--destructive)';
      default:
        return 'var(--muted)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completada':
        return 'Completada';
      case 'en-progreso':
        return 'En Progreso';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const stats = {
    total: mockAppointments.length,
    completadas: mockAppointments.filter(a => a.status === 'completada').length,
    pendientes: mockAppointments.filter(a => a.status === 'pendiente').length,
    enProgreso: mockAppointments.filter(a => a.status === 'en-progreso').length
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                  Sistema Médico
                </h2>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Panel de Médico
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onViewProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                <Settings size={18} />
                <span style={{ fontSize: 'var(--text-body)' }}>Mi Perfil</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--destructive)',
                  border: `1px solid var(--destructive)`
                }}
              >
                <LogOut size={18} />
                <span style={{ fontSize: 'var(--text-body)' }}>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 style={{ color: 'var(--foreground)' }}>
            Dra. María González
          </h1>
          <p className="mt-2" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
            Cardiología - Cédula Profesional: 12345678
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Total Hoy
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  {stats.total}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: 'rgba(0, 82, 204, 0.1)' }}
              >
                <Calendar size={24} style={{ color: 'var(--primary)' }} />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Completadas
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  {stats.completadas}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)' }}
              >
                <CheckCircle size={24} style={{ color: 'var(--secondary)' }} />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  En Progreso
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  {stats.enProgreso}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: 'rgba(0, 184, 217, 0.1)' }}
              >
                <Clock size={24} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Pendientes
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  {stats.pendientes}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: 'rgba(0, 82, 204, 0.1)' }}
              >
                <AlertCircle size={24} style={{ color: 'var(--primary)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: 'var(--muted)',
                color: 'var(--foreground)'
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <h2 style={{ color: 'var(--foreground)' }}>
                {formatDate(selectedDate)}
              </h2>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                Agenda Diaria
              </p>
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: 'var(--muted)',
                color: 'var(--foreground)'
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Appointments Timeline */}
        <div className="rounded-lg shadow-md" style={{ backgroundColor: 'var(--card)' }}>
          <div className="p-6" style={{ borderBottom: `1px solid var(--border)` }}>
            <h2 style={{ color: 'var(--foreground)' }}>
              Citas del Día
            </h2>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
              {mockAppointments.length} citas programadas
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {mockAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 transition-all duration-200 hover:bg-opacity-50"
                style={{
                  backgroundColor: appointment.status === 'en-progreso' ? 'rgba(0, 184, 217, 0.05)' : 'transparent'
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Time */}
                  <div className="flex-shrink-0 w-20">
                    <div className="flex items-center gap-2">
                      <Clock size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                        {appointment.time}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                      {appointment.duration} min
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div
                    className="flex-shrink-0 w-1 h-20 rounded-full"
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  />

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--muted)' }}
                        >
                          <User size={24} style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                            {appointment.patient.name}
                          </p>
                          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                            {appointment.patient.age} años - {appointment.patient.phone}
                          </p>
                        </div>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-white flex-shrink-0"
                        style={{
                          backgroundColor: getStatusColor(appointment.status),
                          fontSize: 'var(--text-caption)'
                        }}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                      <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>Motivo: </span>
                        {appointment.reason}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {appointment.status === 'pendiente' && (
                        <button
                          className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-foreground)',
                            fontSize: 'var(--text-caption)'
                          }}
                        >
                          Iniciar Consulta
                        </button>
                      )}
                      {appointment.status === 'en-progreso' && (
                        <>
                          <button
                            className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                            style={{
                              backgroundColor: 'var(--secondary)',
                              color: 'var(--secondary-foreground)',
                              fontSize: 'var(--text-caption)'
                            }}
                          >
                            Finalizar Consulta
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: 'var(--primary-foreground)',
                              fontSize: 'var(--text-caption)'
                            }}
                          >
                            Ver Expediente
                          </button>
                        </>
                      )}
                      {appointment.status === 'completada' && (
                        <button
                          className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--primary)',
                            border: `1px solid var(--primary)`,
                            fontSize: 'var(--text-caption)'
                          }}
                        >
                          Ver Resumen
                        </button>
                      )}
                      <button
                        className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--muted-foreground)',
                          border: `1px solid var(--border)`,
                          fontSize: 'var(--text-caption)'
                        }}
                      >
                        Ver Historial
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
