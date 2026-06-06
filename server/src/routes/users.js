import express from 'express';
import authenticate from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  return res.json(req.user);
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const allowed = [
      'nombre',
      'apellido',
      'telefono',
      'fechaNacimiento',
      'genero',
      'direccion',
      'ciudad',
      'codigoPostal',
      'grupoSanguineo',
      'medicalHistory',
      'especialidad',
      'bio'
    ];

    const payload = {};
    Object.keys(updates).forEach((key) => {
      if (allowed.includes(key)) {
        payload[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, payload, {
      new: true,
      runValidators: true
    }).select('-password');

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error actualizando perfil' });
  }
});

export default router;
