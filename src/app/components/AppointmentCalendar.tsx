import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';

interface AppointmentCalendarProps {
  onBack: () => void;
  doctorName: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const morningStart = 9;
  const morningEnd = 13;
  const afternoonStart = 15;
  const afternoonEnd = 19;

  for (let hour = morningStart; hour < morningEnd; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ time, available: Math.random() > 0.3 });
    }
  }

  for (let hour = afternoonStart; hour < afternoonEnd; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ time, available: Math.random() > 0.3 });
    }
  }

  return slots;
};

export function AppointmentCalendar({ onBack, doctorName }: AppointmentCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const getWeekDays = (startDate: Date): Date[] => {
    const days: Date[] = [];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const changeWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const weekDays = getWeekDays(currentWeekStart);
  const timeSlots = generateTimeSlots();

  const formatDayHeader = (date: Date) => ({
    dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
    dayNumber: date.getDate(),
    month: date.toLocaleDateString('es-ES', { month: 'short' })
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const handleConfirmAppointment = () => {
    if (selectedDate && selectedTime) {
      alert(`Cita confirmada:\nMédico: ${doctorName}\nFecha: ${selectedDate.toLocaleDateString('es-ES')}\nHora: ${selectedTime}`);
      onBack();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
                  Agendar Cita
                </h2>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  {doctorName}
                </p>
              </div>
            </div>
            {selectedDate && selectedTime && (
              <button
                onClick={handleConfirmAppointment}
                className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--secondary-foreground)'
                }}
              >
                Confirmar Cita
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="mb-6 rounded-lg p-4 shadow-md flex items-center justify-between" style={{ backgroundColor: 'var(--card)' }}>
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 rounded-lg transition-all duration-200 hover:opacity-80"
            style={{
              backgroundColor: 'var(--muted)',
              color: 'var(--foreground)'
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
              {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
              Semana del {weekDays[0].getDate()} al {weekDays[6].getDate()}
            </p>
          </div>
          <button
            onClick={() => changeWeek(1)}
            className="p-2 rounded-lg transition-all duration-200 hover:opacity-80"
            style={{
              backgroundColor: 'var(--muted)',
              color: 'var(--foreground)'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: 'var(--card)' }}>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--border)' }}>
            {weekDays.map((day, index) => {
              const header = formatDayHeader(day);
              const selected = isSameDay(selectedDate, day);
              const today = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                    setSelectedTime(null);
                  }}
                  className="p-4 text-center transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: selected ? 'var(--primary)' : today ? 'var(--accent)' : 'var(--card)',
                    color: selected ? 'var(--primary-foreground)' : today ? 'var(--accent-foreground)' : 'var(--foreground)'
                  }}
                >
                  <div style={{ fontSize: 'var(--text-caption)' }}>
                    {header.dayName}
                  </div>
                  <div style={{ fontSize: 'var(--text-h2)' }}>
                    {header.dayNumber}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', opacity: 0.7 }}>
                    {header.month}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Horarios Disponibles - {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
              </div>

              {/* Morning Slots */}
              <div className="mb-6">
                <p className="mb-3" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                  Mañana
                </p>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {timeSlots.filter(slot => {
                    const hour = parseInt(slot.time.split(':')[0]);
                    return hour < 13;
                  }).map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className="px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: selectedTime === slot.time ? 'var(--secondary)' : slot.available ? 'var(--primary)' : 'var(--muted)',
                        color: selectedTime === slot.time ? 'var(--secondary-foreground)' : slot.available ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        fontSize: 'var(--text-caption)'
                      }}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon Slots */}
              <div>
                <p className="mb-3" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                  Tarde
                </p>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {timeSlots.filter(slot => {
                    const hour = parseInt(slot.time.split(':')[0]);
                    return hour >= 15;
                  }).map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className="px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: selectedTime === slot.time ? 'var(--secondary)' : slot.available ? 'var(--primary)' : 'var(--muted)',
                        color: selectedTime === slot.time ? 'var(--secondary-foreground)' : slot.available ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        fontSize: 'var(--text-caption)'
                      }}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--primary)' }} />
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                    Disponible
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--secondary)' }} />
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                    Seleccionado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--muted)' }} />
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                    No disponible
                  </span>
                </div>
              </div>
            </div>
          )}

          {!selectedDate && (
            <div className="p-12 text-center">
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                Seleccione un día de la semana para ver los horarios disponibles
              </p>
            </div>
          )}
        </div>

        {/* Selected Appointment Summary */}
        {selectedDate && selectedTime && (
          <div
            className="mt-6 rounded-lg p-6 shadow-md"
            style={{
              backgroundColor: 'var(--card)',
              border: `2px solid var(--secondary)`
            }}
          >
            <h3 className="mb-4" style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
              Resumen de Cita
            </h3>
            <div className="space-y-2">
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Médico: </span>
                {doctorName}
              </p>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Fecha: </span>
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Hora: </span>
                {selectedTime}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
