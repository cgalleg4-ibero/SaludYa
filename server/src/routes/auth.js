import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      password,
      role,
      especialidad,
      fechaNacimiento,
      genero,
      direccion,
      ciudad,
      codigoPostal,
      grupoSanguineo,
      medicalHistory
    } = req.body;

    if (!nombre || !apellido || !email || !password || !role) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nombre,
      apellido,
      email,
      telefono: telefono || '',
      password: hashedPassword,
      role,
      especialidad: role === 'doctor' ? especialidad || '' : '',
      fechaNacimiento: fechaNacimiento || undefined,
      genero: genero || '',
      direccion: direccion || '',
      ciudad: ciudad || '',
      codigoPostal: codigoPostal || '',
      grupoSanguineo: grupoSanguineo || '',
      medicalHistory: medicalHistory || {}
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error registrando al usuario' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan credenciales' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error iniciando sesión' });
  }
});

export default router;
