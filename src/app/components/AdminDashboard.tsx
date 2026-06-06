import { useEffect, useState } from 'react';
import {
  LogOut,
  Settings,
  Users,
  Activity,
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Key,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import {
  getUsers,
  updateUser,
  registerUser,
  getAppointments,
  updateAppointment,
  deleteAppointment
} from '../api';
import {
  success as notifySuccess,
  error as notifyError,
  confirm as notifyConfirm,
  promptPassword
} from '../utils/notify';

interface AdminDashboardProps {
  user: { nombre: string; apellido: string };
  onLogout: () => void;
  onViewProfile: () => void;
}

interface UserRecord {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  role: 'patient' | 'doctor' | 'admin' | string;
  especialidad?: string;
  bio?: string;
  createdAt?: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  reason?: string;
  cancelReason?: string | null;
  cancelledBy?: 'patient' | 'doctor' | 'admin' | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | string;
  doctor: string;
  specialty: string;
  patient: {
    name: string;
    phone: string;
  } | null;
}

export function AdminDashboard({ user, onLogout, onViewProfile }: AdminDashboardProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'appointments'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');

  // Search & Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>('all');

  // Modals / Actions states
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form states for creating a user
  const [createNombre, setCreateNombre] = useState('');
  const [createApellido, setCreateApellido] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createTelefono, setCreateTelefono] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [createEspecialidad, setCreateEspecialidad] = useState('');
  const [createBio, setCreateBio] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form states for editing a user
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editRole, setEditRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [editEspecialidad, setEditEspecialidad] = useState('');
  const [editBio, setEditBio] = useState('');

  // Appointment Editor Modals
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editAppDate, setEditAppDate] = useState('');
  const [editAppTime, setEditAppTime] = useState('');
  const [editAppStatus, setEditAppStatus] = useState<'pending' | 'confirmed' | 'completed' | 'cancelled'>('pending');
  const [editAppReason, setEditAppReason] = useState('');
  const [editAppCancelReason, setEditAppCancelReason] = useState('');
  const [appUpdateLoading, setAppUpdateLoading] = useState(false);

  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  // Initial Loaders
  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const data = await getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setAppointmentsError(err instanceof Error ? err.message : 'No se pudieron cargar las citas');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAppointments();
  }, []);

  // Actions
  const handleResetPassword = async (userId: string, fullName: string) => {
    const newPassword = await promptPassword(`Nueva clave para ${fullName}`, 'Ingrese al menos 6 caracteres');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      notifyError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setResettingUserId(userId);
    try {
      await updateUser(userId, { password: newPassword });
      notifySuccess('Clave restablecida', `La clave de ${fullName} ha sido actualizada`);
    } catch (err) {
      notifyError('Error', err instanceof Error ? err.message : 'No se pudo actualizar la clave');
    } finally {
      setResettingUserId(null);
    }
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNombre || !createApellido || !createEmail || !createPassword) {
      notifyError('Error', 'Por favor complete los campos obligatorios');
      return;
    }

    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: createNombre,
        apellido: createApellido,
        email: createEmail,
        telefono: createTelefono,
        password: createPassword,
        role: createRole,
        especialidad: createRole === 'doctor' ? createEspecialidad : '',
        bio: createRole === 'doctor' ? createBio : ''
      };

      await registerUser(payload);
      notifySuccess('Usuario registrado', `${createNombre} ${createApellido} ha sido creado con éxito.`);
      
      // Clean states
      setCreateNombre('');
      setCreateApellido('');
      setCreateEmail('');
      setCreateTelefono('');
      setCreatePassword('');
      setCreateRole('patient');
      setCreateEspecialidad('');
      setCreateBio('');
      setIsCreateUserOpen(false);
      
      // Reload users list
      loadUsers();
    } catch (err) {
      notifyError('Error de registro', err instanceof Error ? err.message : 'No se pudo registrar el usuario');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit User Modal
  const openEditUser = (userRec: UserRecord) => {
    setSelectedUser(userRec);
    setEditNombre(userRec.nombre);
    setEditApellido(userRec.apellido);
    setEditTelefono(userRec.telefono || '');
    setEditRole((userRec.role as 'patient' | 'doctor' | 'admin') || 'patient');
    setEditEspecialidad(userRec.especialidad || '');
    setEditBio(userRec.bio || '');
    setIsEditUserOpen(true);
  };

  // Save Edited User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editNombre || !editApellido) {
      notifyError('Error', 'Nombre y Apellido son obligatorios');
      return;
    }

    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: editNombre,
        apellido: editApellido,
        telefono: editTelefono,
        role: editRole,
        especialidad: editRole === 'doctor' ? editEspecialidad : '',
        bio: editRole === 'doctor' ? editBio : ''
      };

      await updateUser(selectedUser._id, payload);
      notifySuccess('Usuario actualizado', 'Los datos del usuario han sido actualizados con éxito.');
      setIsEditUserOpen(false);
      setSelectedUser(null);
      
      // Reload users list
      loadUsers();
    } catch (err) {
      notifyError('Error de edición', err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Appointment Editor Modal
  const openAppointmentEditor = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditAppDate(appointment.date);
    setEditAppTime(appointment.time);
    setEditAppStatus(appointment.status as 'pending' | 'confirmed' | 'completed' | 'cancelled');
    setEditAppReason(appointment.reason || '');
    setEditAppCancelReason(appointment.cancelReason || '');
  };

  // Save Edited Appointment
  const handleSaveAppointment = async () => {
    if (!selectedAppointment) return;
    if (!editAppDate || !editAppTime) {
      notifyError('Error', 'Fecha y hora son obligatorios');
      return;
    }
    if (editAppStatus === 'cancelled' && !editAppCancelReason.trim()) {
      notifyError('Error', 'El motivo de cancelación es obligatorio para cancelar una cita');
      return;
    }

    setAppUpdateLoading(true);
    try {
      await updateAppointment(selectedAppointment.id, {
        date: editAppDate,
        time: editAppTime,
        status: editAppStatus,
        reason: editAppReason,
        cancelReason: editAppStatus === 'cancelled' ? editAppCancelReason.trim() : undefined
      });

      notifySuccess('Cita actualizada', 'La cita se ha modificado correctamente.');
      setSelectedAppointment(null);
      
      // Reload appointments list
      loadAppointments();
    } catch (err) {
      notifyError('Error', err instanceof Error ? err.message : 'No se pudo actualizar la cita');
    } finally {
      setAppUpdateLoading(false);
    }
  };

  // Delete/Cancel Appointment
  const handleDeleteAppointment = async (appointmentId: string) => {
    const confirmed = await notifyConfirm(
      '¿Está seguro?',
      'Esta acción cancelará la cita en el sistema.'
    );
    if (!confirmed) return;

    try {
      await deleteAppointment(appointmentId);
      notifySuccess('Cita cancelada', 'La cita ha sido marcada como cancelada.');
      loadAppointments();
    } catch (err) {
      notifyError('Error', err instanceof Error ? err.message : 'No se pudo cancelar la cita');
    }
  };

  // Statistics Computations
  const counts = {
    admins: users.filter((u) => u.role === 'admin').length,
    doctors: users.filter((u) => u.role === 'doctor').length,
    patients: users.filter((u) => u.role === 'patient').length,
    appointmentsTotal: appointments.length,
    appointmentsPending: appointments.filter((a) => a.status === 'pending' || a.status === 'pendiente').length,
    appointmentsConfirmed: appointments.filter((a) => a.status === 'confirmed' || a.status === 'confirmada').length,
    appointmentsCompleted: appointments.filter((a) => a.status === 'completed' || a.status === 'completada').length,
    appointmentsCancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'cancelada').length
  };

  // Recharts Data
  const roleChartData = [
    { name: 'Pacientes', value: counts.patients, color: '#0052CC' },
    { name: 'Doctores', value: counts.doctors, color: '#36B37E' },
    { name: 'Admins', value: counts.admins, color: '#9747FF' }
  ];

  const appointmentChartData = [
    { name: 'Pendientes', cantidad: counts.appointmentsPending, fill: '#FFAB00' },
    { name: 'Confirmadas', cantidad: counts.appointmentsConfirmed, fill: '#36B37E' },
    { name: 'Completadas', cantidad: counts.appointmentsCompleted, fill: '#00B8D9' },
    { name: 'Canceladas', cantidad: counts.appointmentsCancelled, fill: '#DE350B' }
  ];

  // Filters logic
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
    const email = u.email.toLowerCase();
    const searchMatch =
      fullName.includes(userSearchQuery.toLowerCase()) ||
      email.includes(userSearchQuery.toLowerCase());
    const roleMatch = userRoleFilter === 'all' || u.role === userRoleFilter;
    return searchMatch && roleMatch;
  });

  const filteredAppointments = appointments.filter((a) => {
    const doctorName = a.doctor.toLowerCase();
    const patientName = a.patient ? a.patient.name.toLowerCase() : '';
    const searchMatch =
      doctorName.includes(appointmentSearchQuery.toLowerCase()) ||
      patientName.includes(appointmentSearchQuery.toLowerCase());
    
    // Support Spanish / English statuses
    let statusMatch = appointmentStatusFilter === 'all';
    if (!statusMatch) {
      if (appointmentStatusFilter === 'pending') {
        statusMatch = a.status === 'pending' || a.status === 'pendiente';
      } else if (appointmentStatusFilter === 'confirmed') {
        statusMatch = a.status === 'confirmed' || a.status === 'confirmada';
      } else if (appointmentStatusFilter === 'completed') {
        statusMatch = a.status === 'completed' || a.status === 'completada';
      } else if (appointmentStatusFilter === 'cancelled') {
        statusMatch = a.status === 'cancelled' || a.status === 'cancelada';
      }
    }

    return searchMatch && statusMatch;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confirmada':
        return 'Confirmada';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'completed':
      case 'completada':
        return 'Completada';
      case 'cancelled':
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confirmada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
      case 'pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
      case 'completada':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'cancelled':
      case 'cancelada':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 transform border-r border-slate-800 flex flex-col justify-between ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-0'
        } lg:relative lg:translate-x-0`}
      >
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">SaludYa</h1>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Admin Panel</span>
            </div>
          </div>

          {/* User profile brief */}
          <div className="p-4 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-sm">
                AD
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user.nombre} {user.apellido}</p>
                <p className="text-[11px] text-slate-500 font-medium">Administrador Principal</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                  : 'hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                <span>Panel General</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'dashboard' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:translate-x-0.5'}`} />
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                  : 'hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Gestión de Usuarios</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'users' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:translate-x-0.5'}`} />
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                activeTab === 'appointments'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                  : 'hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                <span>Gestión de Citas</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'appointments' ? 'rotate-90 text-white' : 'text-slate-600 group-hover:translate-x-0.5'}`} />
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <button
            onClick={onViewProfile}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium border border-slate-800 hover:bg-slate-800/80 hover:text-white transition-all duration-150"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración de Perfil</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium border border-rose-950/30 text-rose-400 bg-rose-950/10 hover:bg-rose-950/30 hover:text-rose-200 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Panel General y Métricas'}
              {activeTab === 'users' && 'Módulo de Gestión de Usuarios'}
              {activeTab === 'appointments' && 'Módulo de Gestión de Citas'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              <Activity className="w-3 h-3 text-blue-500 animate-pulse" /> Servidor API Conectado
            </span>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DASHBOARD / GENERAL METRICS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-blue-400 hover:shadow-md transition-all duration-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctores</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{counts.doctors}</p>
                    <span className="text-[10px] text-emerald-500 font-medium">Médicos especialistas</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-blue-400 hover:shadow-md transition-all duration-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pacientes</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{counts.patients}</p>
                    <span className="text-[10px] text-blue-500 font-medium">Usuarios registrados</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-blue-400 hover:shadow-md transition-all duration-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Citas Totales</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{counts.appointmentsTotal}</p>
                    <span className="text-[10px] text-slate-500 font-medium">{counts.appointmentsConfirmed} confirmadas</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between group hover:border-blue-400 hover:shadow-md transition-all duration-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendientes de Aprobación</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{counts.appointmentsPending}</p>
                    <span className="text-[10px] text-amber-500 font-medium">Citas por confirmar</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: User roles */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Distribución de Usuarios</h3>
                    <p className="text-xs text-slate-400">Total de cuentas en la base de datos de SaludYa</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {roleChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Appointment statuses */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Métricas de Citas</h3>
                    <p className="text-xs text-slate-400">Clasificación por estado del agendamiento</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appointmentChartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                          {appointmentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Appointments & System Activity */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Actividad de Citas Recientes</h3>
                    <p className="text-xs text-slate-400">Últimas citas registradas en la plataforma</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Ver todas las citas →
                  </button>
                </div>
                
                {appointmentsLoading ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Cargando datos del sistema...</div>
                ) : appointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No hay citas registradas en la plataforma.</div>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    <table className="min-w-full text-left align-middle text-sm">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Paciente</th>
                          <th className="px-6 py-3 font-semibold">Doctor</th>
                          <th className="px-6 py-3 font-semibold">Fecha y Hora</th>
                          <th className="px-6 py-3 font-semibold">Especialidad</th>
                          <th className="px-6 py-3 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointments.slice(0, 5).map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-800">
                              {app.patient ? app.patient.name : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {app.doctor}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(app.date)}
                              </span>
                              <span className="inline-flex items-center gap-1 ml-3 font-medium text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {app.time}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {app.specialty}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColorClass(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* User management actions & search bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 max-w-2xl">
                  {/* Text search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o correo electrónico..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {/* Role filter */}
                  <div className="relative">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos los Roles</option>
                      <option value="patient">Pacientes</option>
                      <option value="doctor">Doctores</option>
                      <option value="admin">Administradores</option>
                    </select>
                    <Filter className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              {/* User table grid */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {usersLoading ? (
                  <div className="p-8 text-center text-slate-500">Cargando lista de usuarios...</div>
                ) : usersError ? (
                  <div className="p-8 text-center text-rose-500 font-medium">{usersError}</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No se encontraron usuarios coincidentes.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left align-middle text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Nombre</th>
                          <th className="px-6 py-3">Correo Electrónico</th>
                          <th className="px-6 py-3">Teléfono</th>
                          <th className="px-6 py-3">Rol</th>
                          <th className="px-6 py-3">Especialidad</th>
                          <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-800">
                              {item.nombre} {item.apellido}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {item.email}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {item.telefono || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                item.role === 'doctor' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.role === 'admin' ? 'Administrador' :
                                 item.role === 'doctor' ? 'Doctor/a' : 'Paciente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {item.especialidad || '—'}
                            </td>
                            <td className="px-6 py-4 text-right space-x-1.5">
                              <button
                                onClick={() => openEditUser(item)}
                                className="inline-flex p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                title="Editar datos"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                disabled={resettingUserId === item._id}
                                onClick={() => handleResetPassword(item._id, `${item.nombre} ${item.apellido}`)}
                                className="inline-flex p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all disabled:opacity-50"
                                title="Restablecer contraseña"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENT MANAGEMENT */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              {/* Appointment search and filter tools */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cita por doctor o por nombre del paciente..."
                    value={appointmentSearchQuery}
                    onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <select
                    value={appointmentStatusFilter}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                  <Filter className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Appointment Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {appointmentsLoading ? (
                  <div className="p-8 text-center text-slate-500">Cargando citas del sistema...</div>
                ) : appointmentsError ? (
                  <div className="p-8 text-center text-rose-500 font-medium">{appointmentsError}</div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No se encontraron citas en el sistema.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left align-middle text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Paciente</th>
                          <th className="px-6 py-3">Médico</th>
                          <th className="px-6 py-3">Fecha y Hora</th>
                          <th className="px-6 py-3">Motivo de consulta</th>
                          <th className="px-6 py-3">Estado</th>
                          <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAppointments.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{app.patient ? app.patient.name : 'N/A'}</p>
                              <p className="text-xs text-slate-400 font-medium">{app.patient ? app.patient.phone : ''}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-700">{app.doctor}</p>
                              <p className="text-xs text-slate-400">{app.specialty}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(app.date)}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-xs">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {app.time}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={app.reason}>
                              {app.reason || 'Consulta general'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColorClass(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                              {app.status === 'cancelled' && app.cancelReason && (
                                <p className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate" title={app.cancelReason}>
                                  Motivo: {app.cancelReason}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-1.5">
                              <button
                                onClick={() => openAppointmentEditor(app)}
                                className="inline-flex p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                title="Editar cita"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAppointment(app.id)}
                                className="inline-flex p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                                title="Cancelar / Eliminar cita"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CREATE USER */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Registrar Nuevo Usuario
              </h3>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={createNombre}
                    onChange={(e) => setCreateNombre(e.target.value)}
                    placeholder="Ej. Juan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={createApellido}
                    onChange={(e) => setCreateApellido(e.target.value)}
                    placeholder="Ej. Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="ejemplo@saludya.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={createTelefono}
                    onChange={(e) => setCreateTelefono(e.target.value)}
                    placeholder="Ej. 5512345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Clave Inicial *</label>
                  <input
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rol en el sistema *</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as 'patient' | 'doctor' | 'admin')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="patient">Paciente</option>
                  <option value="doctor">Médico / Doctor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Special doctor fields */}
              {createRole === 'doctor' && (
                <div className="space-y-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">Especialidad médica</label>
                    <input
                      type="text"
                      value={createEspecialidad}
                      onChange={(e) => setCreateEspecialidad(e.target.value)}
                      placeholder="Ej. Cardiología, Pediatría, etc."
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">Breve biografía del doctor</label>
                    <textarea
                      value={createBio}
                      onChange={(e) => setCreateBio(e.target.value)}
                      placeholder="Trayectoria profesional y atención..."
                      rows={3}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Registrando...' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Editar Usuario
              </h3>
              <button
                onClick={() => {
                  setIsEditUserOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={editApellido}
                    onChange={(e) => setEditApellido(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email (No modificable)</label>
                <input
                  type="email"
                  disabled
                  value={selectedUser.email}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rol en el sistema *</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'patient' | 'doctor' | 'admin')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="patient">Paciente</option>
                  <option value="doctor">Médico / Doctor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Special doctor fields */}
              {editRole === 'doctor' && (
                <div className="space-y-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">Especialidad médica</label>
                    <input
                      type="text"
                      value={editEspecialidad}
                      onChange={(e) => setEditEspecialidad(e.target.value)}
                      placeholder="Ej. Cardiología, Pediatría, etc."
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1.5">Breve biografía del doctor</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Trayectoria profesional..."
                      rows={3}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditUserOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT APPOINTMENT / RESCHEDULE */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Gestionar Cita Médica
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Brief app info */}
              <div className="p-3 border border-slate-100 bg-slate-50 rounded-lg text-xs space-y-1.5">
                <p className="text-slate-600"><strong className="text-slate-700 font-semibold">Paciente:</strong> {selectedAppointment.patient ? selectedAppointment.patient.name : 'N/A'}</p>
                <p className="text-slate-600"><strong className="text-slate-700 font-semibold">Médico:</strong> {selectedAppointment.doctor} ({selectedAppointment.specialty})</p>
                <p className="text-slate-600"><strong className="text-slate-700 font-semibold">Motivo:</strong> {selectedAppointment.reason || 'Sin motivo específico'}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fecha de la cita *</label>
                <input
                  type="date"
                  required
                  value={editAppDate}
                  onChange={(e) => setEditAppDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hora de la cita *</label>
                <input
                  type="time"
                  required
                  value={editAppTime}
                  onChange={(e) => setEditAppTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Estado de la cita *</label>
                <select
                  value={editAppStatus}
                  onChange={(e) => setEditAppStatus(e.target.value as 'pending' | 'confirmed' | 'completed' | 'cancelled')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Síntomas / Motivo</label>
                <input
                  type="text"
                  value={editAppReason}
                  onChange={(e) => setEditAppReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {editAppStatus === 'cancelled' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1.5">Motivo de Cancelación *</label>
                  <textarea
                    required
                    rows={2}
                    value={editAppCancelReason}
                    onChange={(e) => setEditAppCancelReason(e.target.value)}
                    placeholder="Indique el motivo por el cual se cancela la cita..."
                    className="w-full bg-slate-50 border border-rose-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={appUpdateLoading}
                  onClick={handleSaveAppointment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {appUpdateLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
