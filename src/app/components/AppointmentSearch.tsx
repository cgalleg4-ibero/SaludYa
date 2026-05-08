import { Search, Filter, Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface AppointmentSearchProps {
  onBack: () => void;
  onSelectDoctor: (doctorId: string) => void;
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

const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dra. María González',
    specialty: 'Cardiología',
    available: true,
    nextAvailable: '2026-05-05 10:00',
    rating: 4.8,
    consultations: 245
  },
  {
    id: '2',
    name: 'Dr. Carlos Ramírez',
    specialty: 'Medicina General',
    available: true,
    nextAvailable: '2026-05-05 14:30',
    rating: 4.9,
    consultations: 312
  },
  {
    id: '3',
    name: 'Dra. Ana Martínez',
    specialty: 'Dermatología',
    available: true,
    nextAvailable: '2026-05-06 09:00',
    rating: 4.7,
    consultations: 198
  },
  {
    id: '4',
    name: 'Dr. Roberto Silva',
    specialty: 'Traumatología',
    available: false,
    nextAvailable: '2026-05-08 11:00',
    rating: 4.6,
    consultations: 156
  },
  {
    id: '5',
    name: 'Dra. Laura Fernández',
    specialty: 'Pediatría',
    available: true,
    nextAvailable: '2026-05-05 16:00',
    rating: 5.0,
    consultations: 421
  },
  {
    id: '6',
    name: 'Dr. Pedro López',
    specialty: 'Neurología',
    available: true,
    nextAvailable: '2026-05-06 15:30',
    rating: 4.8,
    consultations: 287
  }
];

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

  const filteredDoctors = mockDoctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'Todas' || doctor.specialty === selectedSpecialty;
    const matchesAvailability = !showAvailableOnly || doctor.available;

    return matchesSearch && matchesSpecialty && matchesAvailability;
  });

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
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
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                {filteredDoctors.length} {filteredDoctors.length === 1 ? 'resultado' : 'resultados'} encontrados
              </p>
            </div>

            <div className="space-y-4">
              {filteredDoctors.map((doctor) => {
                const nextAvail = formatDateTime(doctor.nextAvailable);
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
                              onClick={() => onSelectDoctor(doctor.id)}
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
