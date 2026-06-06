import { useEffect, useState } from 'react';
import { Calendar, Clock, User, LogOut, Settings, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAppointments, updateAppointment } from '../api';
import { DoctorAvailabilityEditor } from './DoctorAvailabilityEditor';

interface DoctorDashboardProps {
  doctorId: string;
  user: { nombre: string; apellido: string; especialidad?: string };
  onLogout: () => void;
  onViewProfile: () => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  patient: { name: string; phone: string } | null;
  reason: string;
  cancelReason?: string | null;
  cancelledBy?: 'patient' | 'doctor' | 'admin' | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctor: string;
  specialty: string;
}

export function DoctorDashboard({ doctorId, user, onLogout, onViewProfile }: DoctorDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAppointments();
        setAppointments(response);
      } catch {
        setError('No se pudieron cargar las citas.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'var(--secondary)';
      case 'confirmed':
        return 'var(--accent)';
      case 'pending':
        return 'var(--primary)';
      case 'cancelled':
        return 'var(--destructive)';
      default:
        return 'var(--muted)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getFormattedDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const selectedDateString = getFormattedDate(selectedDate);
  const filteredAppointments = appointments.filter((appointment) => appointment.date === selectedDateString);

  const handleToggleStatus = async (appointment: Appointment) => {
    const nextStatus =
      appointment.status === 'pending'
        ? 'confirmed'
        : appointment.status === 'confirmed'
        ? 'completed'
        : appointment.status;
    if (nextStatus === appointment.status) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoadingId(appointment.id);
    try {
      await updateAppointment(appointment.id, { status: nextStatus });
      setAppointments((prev) =>
        prev.map((item) => (item.id === appointment.id ? { ...item, status: nextStatus } : item)),
      );
      setActionSuccess(`Cita marcada como ${getStatusText(nextStatus)}.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo actualizar el estado');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCancelModal = (appointmentId: string) => {
    setCancelAppointmentId(appointmentId);
    setCancelReasonInput('');
    setActionError(null);
    setActionSuccess(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancelAppointment = async () => {
    if (!cancelAppointmentId) {
      setActionError('No se pudo identificar la cita a cancelar.');
      return;
    }
    const cancelReason = cancelReasonInput.trim();
    if (!cancelReason) {
      setActionError('El motivo de cancelación es obligatorio.');
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setActionLoadingId(cancelAppointmentId);
    try {
      await updateAppointment(cancelAppointmentId, { status: 'cancelled', cancelReason });
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === cancelAppointmentId ? { ...item, status: 'cancelled', cancelReason } : item,
        ),
      );
      setActionSuccess('Cita cancelada correctamente.');
      setCancelModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cancelar la cita');
    } finally {
      setActionLoadingId(null);
    }
  };

  const stats = {
    total: filteredAppointments.length,
    completadas: filteredAppointments.filter((a) => a.status === 'completed').length,
    pendientes: filteredAppointments.filter((a) => a.status === 'pending').length,
    enProgreso: filteredAppointments.filter((a) => a.status === 'confirmed').length,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--primary)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>Sistema Médico</h2>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>Panel de Médico</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                <Settings size={18} />
                <span style={{ fontSize: 'var(--text-body)' }}>Configuración</span>
              </button>
              <button onClick={onViewProfile} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <span style={{ fontSize: 'var(--text-body)' }}>Mi Perfil</span>
              </button>
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80" style={{ backgroundColor: 'transparent', color: 'var(--destructive)', border: `1px solid var(--destructive)` }}>
                <LogOut size={18} />
                <span style={{ fontSize: 'var(--text-body)' }}>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cancel Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setCancelModalOpen(false)} />
            <div className="relative w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
              <div className="mb-4">
                <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>Cancelar cita</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 4 }}>Ingrese el motivo de cancelación para esta cita.</p>
              </div>
              <div className="space-y-3">
                <label htmlFor="cancel-reason" className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>Motivo de cancelación</label>
                <textarea id="cancel-reason" value={cancelReasonInput} onChange={(e) => setCancelReasonInput(e.target.value)} rows={4} className="w-full rounded-lg border p-3" style={{ backgroundColor: 'var(--input)', color: 'var(--foreground)', borderColor: 'var(--border)' }} />
                {actionError && <p style={{ color: 'var(--destructive)', fontSize: 'var(--text-sm)' }}>{actionError}</p>}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setCancelModalOpen(false)} className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>Cerrar</button>
                <button type="button" onClick={handleConfirmCancelAppointment} disabled={!cancelReasonInput.trim()} className="rounded-lg px-4 py-2" style={{ backgroundColor: cancelReasonInput.trim() ? 'var(--destructive)' : 'var(--muted)', color: cancelReasonInput.trim() ? 'var(--destructive-foreground)' : 'var(--foreground)' }}>Confirmar cancelación</button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 style={{ color: 'var(--foreground)' }}>Dra. {user?.nombre} {user?.apellido}</h1>
          <p className="mt-2" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>{user?.especialidad || 'Médico General'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>Total Hoy</p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>{stats.total}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'rgba(0, 82, 204, 0.1)' }}>
                <Calendar size={24} style={{ color: 'var(--primary)' }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>Completadas</p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>{stats.completadas}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)' }}>
                <CheckCircle size={24} style={{ color: 'var(--secondary)' }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>En Progreso</p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>{stats.enProgreso}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'rgba(0, 184, 217, 0.1)' }}>
                <Clock size={24} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>Pendientes</p>
                <p style={{ fontSize: 'var(--text-h1)', color: 'var(--foreground)' }}>{stats.pendientes}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'rgba(0, 82, 204, 0.1)' }}>
                <AlertCircle size={24} style={{ color: 'var(--primary)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSettingsOpen(false)} />
            <div className="relative w-full max-w-3xl rounded-lg border bg-card p-6 shadow-lg" style={{ backgroundColor: 'var(--card)', maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto' }}>
              <div className="mb-4">
                <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--foreground)' }}>
                  Configuración de agenda
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
                  Ajusta los días y los slots disponibles para tu agenda.
                </p>
              </div>
              <DoctorAvailabilityEditor doctorId={doctorId} onClose={() => setSettingsOpen(false)} />
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div className="mb-6 rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
          <div className="flex items-center justify-between">
            <button onClick={() => changeDate(-1)} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <h2 style={{ color: 'var(--foreground)' }}>{formatDate(selectedDate)}</h2>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>Agenda Diaria</p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="rounded-lg shadow-md" style={{ backgroundColor: 'var(--card)' }}>
          <div className="p-6" style={{ borderBottom: `1px solid var(--border)` }}>
            <h2 style={{ color: 'var(--foreground)' }}>Citas del Día</h2>
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>{loading ? 'Cargando citas...' : error ? 'Error al cargar citas' : `${filteredAppointments.length} citas programadas`}</p>
            {actionError && <p style={{ marginTop: 12, fontSize: 'var(--text-body)', color: 'var(--destructive)' }}>{actionError}</p>}
            {actionSuccess && <p style={{ marginTop: 12, fontSize: 'var(--text-body)', color: 'var(--secondary)' }}>{actionSuccess}</p>}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {!loading && !error && filteredAppointments.length === 0 && (
              <div className="p-6 text-center" style={{ color: 'var(--muted-foreground)' }}>No hay citas registradas para esta fecha.</div>
            )}
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 transition-all duration-200 hover:bg-opacity-50" style={{ backgroundColor: appointment.status === 'confirmed' ? 'rgba(0, 184, 217, 0.05)' : 'transparent' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-20">
                    <div className="flex items-center gap-2">
                      <Clock size={16} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>{appointment.time}</span>
                    </div>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>30 min</p>
                  </div>
                  <div className="flex-shrink-0 w-1 h-20 rounded-full" style={{ backgroundColor: getStatusColor(appointment.status) }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
                          <User size={24} style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>{appointment.patient?.name || 'Paciente no disponible'}</p>
                          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>{appointment.patient?.phone || 'Sin teléfono'}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-white" style={{ backgroundColor: getStatusColor(appointment.status), fontSize: 'var(--text-caption)' }}>{getStatusText(appointment.status)}</span>
                    </div>
                    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                      <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}><span style={{ color: 'var(--muted-foreground)' }}>Motivo: </span>{appointment.reason}</p>
                      {appointment.status === 'cancelled' && appointment.cancelReason && (
                        <p style={{ fontSize: 'var(--text-body)', color: 'var(--destructive)', marginTop: 8 }}>
                          <span style={{ color: 'var(--muted-foreground)' }}>Motivo de cancelación: </span>{appointment.cancelReason}
                          {appointment.cancelledBy && (
                            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)', marginLeft: 8 }}>Cancelado por: {appointment.cancelledBy === 'patient' ? 'paciente' : appointment.cancelledBy === 'doctor' ? 'doctor' : appointment.cancelledBy === 'admin' ? 'administrador' : appointment.cancelledBy}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appointment.status === 'pending' && (
                        <button onClick={() => handleToggleStatus(appointment)} disabled={actionLoadingId === appointment.id} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', fontSize: 'var(--text-caption)' }}>Confirmar Cita</button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button onClick={() => handleToggleStatus(appointment)} disabled={actionLoadingId === appointment.id} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', fontSize: 'var(--text-caption)' }}>Marcar como Completada</button>
                      )}
                      {appointment.status === 'completed' && (
                        <button className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'transparent', color: 'var(--primary)', border: `1px solid var(--primary)`, fontSize: 'var(--text-caption)' }}>Ver Resumen</button>
                      )}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <button onClick={() => openCancelModal(appointment.id)} disabled={actionLoadingId === appointment.id} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'transparent', color: 'var(--destructive)', border: `1px solid var(--destructive)`, fontSize: 'var(--text-caption)' }}>Cancelar</button>
                      )}
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
