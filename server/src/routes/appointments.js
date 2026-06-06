import express from 'express';
import mongoose from 'mongoose';
import authenticate from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { role, _id } = req.user;
    const filter = role === 'admin' ? {} : (role === 'doctor' ? { doctorId: _id } : { patientId: _id });
    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'nombre apellido especialidad')
      .populate('patientId', 'nombre apellido telefono');

    const response = appointments.map((appointment) => ({
      id: appointment._id,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      cancelReason: appointment.cancelReason || null,
      cancelledBy: appointment.cancelledBy || null,
      cancelledById: appointment.cancelledById ? appointment.cancelledById.toString() : null,
      status: appointment.status,
      doctor: appointment.doctorId ? `${appointment.doctorId.nombre} ${appointment.doctorId.apellido}` : 'N/A',
      specialty: appointment.doctorId?.especialidad || 'General',
      patient: appointment.patientId
        ? {
            name: `${appointment.patientId.nombre} ${appointment.patientId.apellido}`,
            phone: appointment.patientId.telefono
          }
        : null
    }));

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error cargando citas' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Solo pacientes pueden agendar citas' });
    }

    const { doctorId, date, time, reason } = req.body;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'doctorId, date y time son obligatorios' });
    }

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const now = new Date();
    const [hh, mm] = time.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    const slotDateTime = new Date(year, month - 1, day, hh, mm, 0, 0);

    if (slotDateTime.getTime() - now.getTime() < 30 * 60 * 1000) {
      return res.status(400).json({ message: 'Las citas deben programarse con al menos 30 minutos de anticipación' });
    }

    const existing = await Appointment.findOne({ doctorId, date, time, status: { $ne: 'cancelled' } });
    if (existing) {
      return res.status(409).json({ message: 'Horario no disponible' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date,
      time,
      reason: reason || 'Consulta médica',
      status: 'pending'
    });

    doctor.consultas = (doctor.consultas || 0) + 1;
    await doctor.save();

    return res.status(201).json({ id: appointment._id });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Horario ya reservado' });
    }
    return res.status(500).json({ message: 'Error agendando la cita' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const isOwner = appointment.patientId.equals(req.user._id);
    const isDoctor = appointment.doctorId.equals(req.user._id);

    if (req.user.role === 'patient') {
      if (!isOwner) {
        return res.status(403).json({ message: 'No tiene permiso para modificar esta cita' });
      }

      const { status, cancelReason, date, time, reason } = req.body;
      if (status) {
        if (status !== 'cancelled') {
          return res.status(400).json({ message: 'Estado no válido' });
        }
        if (!cancelReason || !cancelReason.trim()) {
          return res.status(400).json({ message: 'Motivo de cancelación es obligatorio' });
        }
        appointment.status = status;
        appointment.cancelReason = cancelReason.trim();
        appointment.cancelledBy = 'patient';
        appointment.cancelledById = req.user._id;
      } else {
        if (['completed', 'cancelled'].includes(appointment.status)) {
          return res.status(400).json({ message: 'No se puede modificar una cita completada o cancelada' });
        }

        if (date && time) {
          const now = new Date();
          const [hh, mm] = time.split(':').map(Number);
          const [year, month, day] = date.split('-').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hh, mm, 0, 0);

          if (slotDateTime.getTime() - now.getTime() < 30 * 60 * 1000) {
            return res.status(400).json({ message: 'Las citas deben reprogramarse con al menos 30 minutos de anticipación' });
          }

          const existing = await Appointment.findOne({
            doctorId: appointment.doctorId,
            date,
            time,
            status: { $ne: 'cancelled' },
            _id: { $ne: appointment._id }
          });

          if (existing) {
            return res.status(409).json({ message: 'Horario no disponible' });
          }

          appointment.date = date;
          appointment.time = time;
        }

        if (reason) {
          appointment.reason = reason;
        }
      }
    } else if (req.user.role === 'doctor') {
      if (!isDoctor) {
        return res.status(403).json({ message: 'No tiene permiso para modificar esta cita' });
      }

      const { status, cancelReason, date, time, reason } = req.body;
      if (status) {
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
          return res.status(400).json({ message: 'Estado no válido' });
        }
        appointment.status = status;
        if (status === 'cancelled') {
          if (!cancelReason || !cancelReason.trim()) {
            return res.status(400).json({ message: 'Motivo de cancelación es obligatorio' });
          }
          appointment.cancelReason = cancelReason.trim();
          appointment.cancelledBy = 'doctor';
          appointment.cancelledById = req.user._id;
        }
      }

      if (date && time) {
        const now = new Date();
        const [hh, mm] = time.split(':').map(Number);
        const [year, month, day] = date.split('-').map(Number);
        const slotDateTime = new Date(year, month - 1, day, hh, mm, 0, 0);

        if (slotDateTime.getTime() - now.getTime() < 30 * 60 * 1000) {
          return res.status(400).json({ message: 'Las citas deben reprogramarse con al menos 30 minutos de anticipación' });
        }

        const existing = await Appointment.findOne({
          doctorId: appointment.doctorId,
          date,
          time,
          status: { $ne: 'cancelled' },
          _id: { $ne: appointment._id }
        });

        if (existing) {
          return res.status(409).json({ message: 'Horario no disponible' });
        }

        appointment.date = date;
        appointment.time = time;
      }

      if (reason) {
        appointment.reason = reason;
      }
    } else if (req.user.role === 'admin') {
      const { status, cancelReason, date, time, reason } = req.body;

      if (status) {
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
          return res.status(400).json({ message: 'Estado no válido' });
        }
        appointment.status = status;
        if (status === 'cancelled') {
          appointment.cancelReason = cancelReason?.trim() || 'Cancelada por administrador';
          appointment.cancelledBy = 'admin';
          appointment.cancelledById = req.user._id;
        }
      }

      if (date && time) {
        const now = new Date();
        const [hh, mm] = time.split(':').map(Number);
        const [year, month, day] = date.split('-').map(Number);
        const slotDateTime = new Date(year, month - 1, day, hh, mm, 0, 0);

        if (slotDateTime.getTime() - now.getTime() < 30 * 60 * 1000) {
          return res.status(400).json({ message: 'Las citas deben reprogramarse con al menos 30 minutos de anticipación' });
        }

        const existing = await Appointment.findOne({
          doctorId: appointment.doctorId,
          date,
          time,
          status: { $ne: 'cancelled' },
          _id: { $ne: appointment._id }
        });

        if (existing) {
          return res.status(409).json({ message: 'Horario no disponible' });
        }

        appointment.date = date;
        appointment.time = time;
      }

      if (reason) {
        appointment.reason = reason;
      }
    } else {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await appointment.save();
    return res.json({ message: 'Cita actualizada', id: appointment._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error actualizando la cita' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const isOwner = appointment.patientId.equals(req.user._id);
    const isDoctor = appointment.doctorId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'No tiene permiso para cancelar esta cita' });
    }

    const { cancelReason } = req.body;
    appointment.status = 'cancelled';
    if (cancelReason && cancelReason.trim()) {
      appointment.cancelReason = cancelReason.trim();
    }
    if (isOwner) {
      appointment.cancelledBy = 'patient';
      appointment.cancelledById = req.user._id;
    } else if (isDoctor) {
      appointment.cancelledBy = 'doctor';
      appointment.cancelledById = req.user._id;
    } else if (isAdmin) {
      appointment.cancelledBy = 'admin';
      appointment.cancelledById = req.user._id;
    }
    await appointment.save();
    return res.json({ message: 'Cita cancelada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error eliminando la cita' });
  }
});

export default router;
