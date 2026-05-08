import { Calendar, Clock, User, Plus, LogOut, Settings } from 'lucide-react';

interface PatientDashboardProps {
  onLogout: () => void;
  onNewAppointment: () => void;
  onViewProfile: () => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: '2026-05-05',
    time: '10:00',
    doctor: 'Dr. María González',
    specialty: 'Cardiología',
    status: 'confirmada'
  },
  {
    id: '2',
    date: '2026-05-08',
    time: '15:30',
    doctor: 'Dr. Carlos Ramírez',
    specialty: 'Medicina General',
    status: 'confirmada'
  },
  {
    id: '3',
    date: '2026-05-12',
    time: '09:00',
    doctor: 'Dra. Ana Martínez',
    specialty: 'Dermatología',
    status: 'pendiente'
  }
];

export function PatientDashboard({ onLogout, onNewAppointment, onViewProfile }: PatientDashboardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'var(--secondary)';
      case 'pendiente':
        return 'var(--accent)';
      case 'cancelada':
        return 'var(--destructive)';
      default:
        return 'var(--muted)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'Confirmada';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
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
                  Panel de Paciente
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
            Bienvenido, Juan Pérez
          </h1>
          <p className="mt-2" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
            Gestione sus citas médicas de forma sencilla
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 hover:opacity-90 shadow-md"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)'
            }}
          >
            <Plus size={20} />
            <span style={{ fontSize: 'var(--text-body)' }}>Nueva Cita</span>
          </button>
        </div>

        {/* Appointments Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: 'var(--foreground)' }}>
              Próximas Citas
            </h2>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-foreground)',
                fontSize: 'var(--text-caption)'
              }}
            >
              {mockAppointments.length} citas programadas
            </span>
          </div>

          {mockAppointments.length === 0 ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <Calendar size={48} style={{ color: 'var(--muted-foreground)', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                No tiene citas programadas
              </p>
              <button
                onClick={onNewAppointment}
                className="mt-4 px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                Agendar Primera Cita
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-lg p-6 shadow-md transition-all duration-200 hover:shadow-lg"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-white"
                      style={{
                        backgroundColor: getStatusColor(appointment.status),
                        fontSize: 'var(--text-caption)'
                      }}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} style={{ color: 'var(--primary)' }} />
                      <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                        {formatDate(appointment.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} style={{ color: 'var(--primary)' }} />
                      <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                        {appointment.time}
                      </p>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="pt-4" style={{ borderTop: `1px solid var(--border)` }}>
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <User size={20} style={{ color: 'var(--muted-foreground)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                          {appointment.doctor}
                        </p>
                        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                          {appointment.specialty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--primary)',
                        border: `1px solid var(--primary)`,
                        fontSize: 'var(--text-caption)'
                      }}
                    >
                      Ver Detalles
                    </button>
                    <button
                      className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--destructive)',
                        border: `1px solid var(--destructive)`,
                        fontSize: 'var(--text-caption)'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Citas Totales
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  12
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

          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Este Mes
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  3
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)' }}
              >
                <Clock size={24} style={{ color: 'var(--secondary)' }} />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Médicos Visitados
                </p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>
                  5
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: 'rgba(0, 184, 217, 0.1)' }}
              >
                <User size={24} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
