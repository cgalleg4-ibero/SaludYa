import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

const getWeekdayIndex = (day) => {
  const map = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6
  };
  return map[(day || '').toString().toLowerCase()] ?? null;
};

const findNextDateForWeekday = (weekday) => {
  const today = new Date();
  const todayIdx = today.getDay();
  const daysUntil = (weekday - todayIdx + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  result.setHours(0, 0, 0, 0);
  return result;
};

const buildDoctorResponse = async (doctor) => {
  const appointmentCount = await Appointment.countDocuments({ doctorId: doctor._id });
  let nextAvailableIso = null;

  if (doctor.availability && doctor.availability.length > 0) {
    // search the next free slot over the upcoming N days
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const DAYS_AHEAD = 28; // look ahead 4 weeks

    const pad = (n) => n.toString().padStart(2, '0');
    const dateToYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // local date

    const startStr = dateToYMD(today);
    const end = new Date(today);
    end.setDate(end.getDate() + DAYS_AHEAD);
    const endStr = dateToYMD(end);

    // fetch existing appointments for this doctor in the window
    const upcomingAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: startStr, $lte: endStr },
      status: { $ne: 'cancelled' }
    });
    const booked = new Set(upcomingAppointments.map(a => `${a.date}_${a.time}`));

    let best = null;
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

      // find availability entries matching this weekday
      const entries = (doctor.availability || []).filter(e => (e.day || '').toString().toLowerCase() === dayName);
      if (!entries.length) continue;

      const dateStr = dateToYMD(d);

      for (const entry of entries) {
        const slots = Array.isArray(entry.slots) ? entry.slots : [];
        for (const time of slots) {
          // build candidate datetime
          const [hh, mm] = time.split(':').map(v => parseInt(v, 10));
          if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
          const candidate = new Date(d);
          candidate.setHours(hh, mm, 0, 0);
          if (candidate.getTime() - now.getTime() < 30 * 60 * 1000) continue; // skip times less than 30 mins in future

          // check if booked
          if (booked.has(`${dateStr}_${time}`)) continue;

          if (!best || candidate < best) best = candidate;
        }
      }

      if (best) break; // earliest found
    }

    if (best) nextAvailableIso = best.toISOString();
  }

  // fallback to current time if nothing found
  if (!nextAvailableIso) nextAvailableIso = new Date().toISOString();

  return {
    id: doctor._id.toString(),
    nombre: doctor.nombre,
    apellido: doctor.apellido,
    name: `${doctor.nombre} ${doctor.apellido}`,
    specialty: doctor.especialidad || 'General',
    available: doctor.availability && doctor.availability.length > 0,
    nextAvailable: nextAvailableIso,
    rating: doctor.rating || 4.8,
    consultations: doctor.consultas || appointmentCount,
    bio: doctor.bio || 'Médico/a con amplia experiencia y atención humanizada.',
    availability: doctor.availability || []
  };
};

router.get('/', async (req, res) => {
  try {
    const { specialty, search } = req.query;
    const filter = { role: 'doctor' };
    if (specialty && specialty !== 'Todas') {
      filter.especialidad = specialty;
    }
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { apellido: { $regex: search, $options: 'i' } },
        { especialidad: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await User.find(filter).limit(50);
    const response = await Promise.all(doctors.map(buildDoctorResponse));
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error cargando médicos' });
  }
});

router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const response = await buildDoctorResponse(doctor);
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error cargando médico' });
  }
});

import authenticate from '../middleware/auth.js';

// Helper to validate availability payload
const validateAvailability = (payload) => {
  if (!Array.isArray(payload.availability)) {
    return 'availability must be an array';
  }
  const validDays = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  const slotRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/; // HH:MM 24h
  for (const entry of payload.availability) {
    if (!validDays.includes((entry.day || '').toString().toLowerCase())) {
      return `Invalid day: ${entry.day}`;
    }
    if (!Array.isArray(entry.slots)) {
      return `Slots for ${entry.day} must be an array`;
    }
    const seen = new Set();
    for (const slot of entry.slots) {
      if (!slotRegex.test(slot)) {
        return `Invalid slot format (${slot}) in ${entry.day}`;
      }
      if (seen.has(slot)) {
        return `Duplicate slot (${slot}) in ${entry.day}`;
      }
      seen.add(slot);
    }
  }
  return null;
};

// PUT route for doctors to update their availability
router.put('/:doctorId/availability', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (req.user.role !== 'doctor' || req.user._id.toString() !== doctorId) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const errorMsg = validateAvailability(req.body);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }
    doctor.availability = req.body.availability;
    await doctor.save();
    const updated = await buildDoctorResponse(doctor);
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error actualizando disponibilidad' });
  }
});

router.get('/:doctorId/availability', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Fecha requerida' });
    }

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const appointments = await Appointment.find({ doctorId, date, status: { $ne: 'cancelled' } });
    const bookedTimes = new Set(appointments.map((item) => item.time));
    const now = new Date();
    
    const isSlotAvailable = (slotTime) => {
      const [hh, mm] = slotTime.split(':').map(Number);
      const [year, month, day] = date.split('-').map(Number);
      const slotDateTime = new Date(year, month - 1, day, hh, mm, 0, 0);
      return (slotDateTime.getTime() - now.getTime()) >= 30 * 60 * 1000;
    };

    const requestedDate = new Date(date);
    const requestedDay = requestedDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const scheduleEntry = (doctor.availability || []).find((entry) => entry.day.toLowerCase() === requestedDay);

    if (scheduleEntry?.slots?.length) {
      const slots = scheduleEntry.slots.map((time) => ({
        time,
        available: !bookedTimes.has(time) && isSlotAvailable(time)
      }));
      return res.json({ slots });
    }

    // No hay horarios disponibles configurados para este día
    return res.json({ slots: [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error cargando horarios' });
  }
});

export default router;
