import { Search, Filter, Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDoctors, getDoctorSlots } from '../api';

interface AppointmentSearchProps {
  onBack: () => void;
  onSelectDoctor: (doctorId: string, doctorName: string) => void;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  nextAvailable: string;
  rating: number;
  consultations: number;
}

// Data is loaded from the backend; remove local mocks.

const specialties = [
  'Todas',
  'Cardiología',
  'Dermatología',
  'Medicina General',
  'Neurología',
  'Pediatría',
  'Traumatología'
];

export function AppointmentSearch({ onBack, onSelectDoctor }: AppointmentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overrideNext, setOverrideNext] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getDoctors({
          specialty: selectedSpecialty === 'Todas' ? '' : selectedSpecialty,
          search: searchQuery
        });
        if (Array.isArray(response)) {
          setDoctors(response as unknown as Doctor[]);
        } else {
          setDoctors([]);
          setError('Respuesta inesperada del servidor');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los médicos');
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [selectedSpecialty, searchQuery]);

  // When doctors or selectedDate change, fetch slots for the date (or today)
  useEffect(() => {
    if (!doctors || doctors.length === 0) return;

    const fetchSlotsForDate = async () => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const today = new Date();
      const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const dateToCheck = selectedDate || ymd(today);

      const results = await Promise.all(
        doctors.map(async (doc) => {
          try {
            const res = await getDoctorSlots(doc.id, dateToCheck);
            if (res && Array.isArray(res.slots)) {
              const first = res.slots.find((s: any) => s.available);
              if (first) {
                // build local ISO for the date+time
                const iso = new Date(`${dateToCheck}T${first.time}:00`).toISOString();
                return [doc.id, iso];
              }
            }
          } catch (e) {
            // ignore per-doctor errors
          }
          return [doc.id, null];
        })
      );

      const map: Record<string, string | null> = {};
      for (const [id, iso] of results) map[id as string] = iso as string | null;
      setOverrideNext(map);
    };

    fetchSlotsForDate();
  }, [doctors, selectedDate]);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'Todas' || doctor.specialty === selectedSpecialty;
    const matchesAvailability = !showAvailableOnly || doctor.available;

    return matchesSearch && matchesSpecialty && matchesAvailability;
  });

  const formatDateTime = (dateTime: string) => {
    const timestamp = Date.parse(dateTime);
    if (Number.isNaN(timestamp)) {
      return {
        date: 'Fecha no disponible',
        time: ''
      };
    }

    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <ArrowLeft size={20} style={{ color: 'var(--foreground)' }} />
            </button>
            <div>
              <h2 style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                Buscar Cita Médica
              </h2>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                Encuentra al médico especialista que necesitas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Filtros */}
          <aside className="lg:w-80 space-y-6">
            {/* Search Bar */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Search size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Búsqueda
                </h3>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o especialidad"
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Specialty Filter */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Especialidad
                </h3>
              </div>
              <div className="space-y-2">
                {specialties.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => setSelectedSpecialty(specialty)}
                    className="w-full text-left px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: selectedSpecialty === specialty ? 'var(--primary)' : 'var(--muted)',
                      color: selectedSpecialty === specialty ? 'var(--primary-foreground)' : 'var(--foreground)',
                      fontSize: 'var(--text-body)'
                    }}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Fecha
                </h3>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Availability Filter */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Solo disponibles hoy
                </span>
              </label>
            </div>
          </aside>

          {/* Main Content - Results */}
          <div className="flex-1">
            <div className="mb-4">
              {loading ? (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                  Cargando médicos...
                </p>
              ) : error ? (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--destructive)' }}>
                  {error}
                </p>
              ) : (
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                  {filteredDoctors.length} {filteredDoctors.length === 1 ? 'resultado' : 'resultados'} encontrados
                </p>
              )}
            </div>

            <div className="space-y-4">
              {filteredDoctors.map((doctor) => {
                const displayed = overrideNext[doctor.id] || doctor.nextAvailable;
                const nextAvail = formatDateTime(displayed);
                return (
                  <div
                    key={doctor.id}
                    className="rounded-lg p-6 shadow-md transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: 'var(--card)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div
                          className="flex items-center justify-center w-16 h-16 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--muted)' }}
                        >
                          <User size={32} style={{ color: 'var(--muted-foreground)' }} />
                        </div>

                        {/* Doctor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                                {doctor.name}
                              </h3>
                              <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                                {doctor.specialty}
                              </p>
                            </div>
                            {doctor.available && (
                              <span
                                className="px-3 py-1 rounded-full text-white"
                                style={{
                                  backgroundColor: 'var(--secondary)',
                                  fontSize: 'var(--text-caption)'
                                }}
                              >
                                Disponible
                              </span>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-1">
                              <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>⭐</span>
                              <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                                {doctor.rating}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={16} style={{ color: 'var(--muted-foreground)' }} />
                              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                                {doctor.consultations} consultas
                              </span>
                            </div>
                          </div>

                          {/* Next Available */}
                          <div
                            className="p-3 rounded-lg mb-4"
                            style={{ backgroundColor: 'var(--background)' }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                                  {nextAvail.date}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={16} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                                  {nextAvail.time}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => onSelectDoctor(doctor.id, doctor.name)}
                              className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                              style={{
                                backgroundColor: 'var(--primary)',
                                color: 'var(--primary-foreground)',
                                fontSize: 'var(--text-body)'
                              }}
                            >
                              Ver Agenda
                            </button>
                            <button
                              className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                              style={{
                                backgroundColor: 'transparent',
                                color: 'var(--primary)',
                                border: `1px solid var(--primary)`,
                                fontSize: 'var(--text-body)'
                              }}
                            >
                              Ver Perfil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredDoctors.length === 0 && (
                <div
                  className="rounded-lg p-12 text-center"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <Search size={48} style={{ color: 'var(--muted-foreground)', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                    No se encontraron médicos con los filtros seleccionados
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('Todas');
                      setSelectedDate('');
                      setShowAvailableOnly(false);
                    }}
                    className="mt-4 px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)'
                    }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
