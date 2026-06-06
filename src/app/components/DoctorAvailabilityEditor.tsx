import React, { useEffect, useState } from 'react';
import { getDoctorProfile, updateDoctorAvailability } from '../api';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface SlotEntry {
  day: string;
  slots: string[];
}

interface DoctorAvailabilityEditorProps {
  doctorId: string;
  onClose?: () => void;
}

/**
 * UI component that allows a doctor to view and edit their weekly availability.
 * The availability format matches the back‑end schema:
 * [{ day: 'lunes', slots: ['09:00', '09:30', ...] }, ...]
 */
export const DoctorAvailabilityEditor: React.FC<DoctorAvailabilityEditorProps> = ({ doctorId, onClose }) => {
  const [availability, setAvailability] = useState<SlotEntry[]>([]);
  const [initialAvailability, setInitialAvailability] = useState<SlotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  const normalizeAvailability = (items: SlotEntry[]) => {
    const order = daysOfWeek.reduce<Record<string, number>>((acc, day, index) => {
      acc[day] = index;
      return acc;
    }, {});

    return items
      .map((entry) => ({
        day: entry.day,
        slots: [...entry.slots].sort(),
      }))
      .sort((a, b) => (order[a.day] ?? 0) - (order[b.day] ?? 0));
  };

  const availabilityKey = (items: SlotEntry[]) => JSON.stringify(normalizeAvailability(items));

  const hasChanges = availabilityKey(availability) !== availabilityKey(initialAvailability);

  // Load current availability from the server
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getDoctorProfile(doctorId);
        const loaded = profile.availability ?? [];
        setAvailability(loaded);
        setInitialAvailability(loaded);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar disponibilidad');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [doctorId]);

  const handleDayChange = (day: string, enabled: boolean) => {
    setAvailability((prev) => {
      const exists = prev.find((d) => d.day === day);
      if (enabled && !exists) {
        // Add empty day entry
        return [...prev, { day, slots: [] }];
      }
      if (!enabled && exists) {
        // Remove day entry
        return prev.filter((d) => d.day !== day);
      }
      return prev;
    });
  };

  const handleSlotChange = (day: string, index: number, value: string) => {
    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const newSlots = [...d.slots];
        newSlots[index] = value;
        return { ...d, slots: newSlots };
      })
    );
  };

  const addSlot = (day: string) => {
    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        return { ...d, slots: [...d.slots, '09:00'] };
      })
    );
  };

  const removeSlot = (day: string, index: number) => {
    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const newSlots = d.slots.filter((_, i) => i !== index);
        return { ...d, slots: newSlots };
      })
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await updateDoctorAvailability(doctorId, availability);
      setInitialAvailability(availability);
      setSuccess('Disponibilidad actualizada correctamente');
      if (onClose) {
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, backgroundColor: 'var(--card)' }}>
        Cargando disponibilidad…
      </div>
    );
  }

  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--card)' }}>
      <h2 style={{ color: 'var(--foreground)' }}>Editar agenda</h2>
      {error && (
        <p style={{ color: 'var(--destructive)' }}>{error}</p>
      )}
      {success && (
        <p style={{ color: 'var(--secondary)' }}>{success}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {daysOfWeek.map((day) => {
          const entry = availability.find((d) => d.day === day);
          const enabled = !!entry;
          return (
            <div key={day} className="border rounded p-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ textTransform: 'capitalize', color: 'var(--foreground)' }}>{day}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleDayChange(day, e.target.checked)}
                />
              </div>
              {enabled && (
                <div>
                  {entry!.slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                      <input
                        type="time"
                        value={slot}
                        onChange={(e) => handleSlotChange(day, idx, e.target.value)}
                        className="rounded border p-1"
                        style={{ backgroundColor: 'var(--input)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
                      />
                      <button onClick={() => removeSlot(day, idx)} title="Eliminar slot">
                        <X size={16} style={{ color: 'var(--destructive)' }} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSlot(day)}
                    className="mt-2 px-3 py-1 rounded bg-primary text-primary-foreground"
                  >
                    + Añadir slot
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end mt-6 gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-muted text-foreground"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!hasChanges || saving}
          className="px-4 py-2 rounded bg-accent text-accent-foreground"
          style={{ opacity: !hasChanges || saving ? 0.6 : 1 }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};
