import express from 'express';
import bcrypt from 'bcrypt';
import authenticate from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const users = await User.find()
      .select('-password -__v')
      .lean();

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error cargando usuarios' });
  }
});

router.put('/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const { password, nombre, apellido, telefono, role, especialidad, bio } = req.body;
    const updates = {};

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    if (nombre !== undefined) updates.nombre = nombre;
    if (apellido !== undefined) updates.apellido = apellido;
    if (telefono !== undefined) updates.telefono = telefono;
    if (role !== undefined) updates.role = role;
    if (especialidad !== undefined) updates.especialidad = especialidad;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

export default router;
