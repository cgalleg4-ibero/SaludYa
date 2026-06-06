import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saludya';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const seedUsers = async () => {
  const doctors = [
    {
      nombre: 'María',
      apellido: 'González',
      email: 'maria.gonzalez@saludya.com',
      telefono: '5512345601',
      password: '12345678',
      role: 'doctor',
      especialidad: 'Cardiología',
      bio: 'Especialista en cardiología con más de 10 años de experiencia.',
      rating: 4.9,
      consultas: 280,
      availability: [
        { day: 'lunes', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
        { day: 'martes', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
        { day: 'miercoles', slots: ['09:00', '09:30', '10:00', '10:30'] },
        { day: 'jueves', slots: ['15:00', '15:30', '16:00', '16:30'] }
      ]
    },
    {
      nombre: 'Carlos',
      apellido: 'Ramírez',
      email: 'carlos.ramirez@saludya.com',
      telefono: '5523456702',
      password: '12345678',
      role: 'doctor',
      especialidad: 'Medicina General',
      bio: 'Atención integral para toda la familia.',
      rating: 4.8,
      consultas: 320,
      availability: [
        { day: 'lunes', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'] },
        { day: 'martes', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'] },
        { day: 'miercoles', slots: ['15:00', '15:30', '16:00', '16:30', '17:00'] },
        { day: 'viernes', slots: ['09:00', '09:30', '10:00', '10:30', '11:00'] }
      ]
    },
    {
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'ana.martinez@saludya.com',
      telefono: '5534567803',
      password: '12345678',
      role: 'doctor',
      especialidad: 'Dermatología',
      bio: 'Cuida tu piel con diagnósticos precisos.',
      rating: 4.7,
      consultas: 195,
      availability: [
        { day: 'martes', slots: ['10:00', '10:30', '11:00', '11:30', '12:00'] },
        { day: 'jueves', slots: ['12:00', '12:30', '13:00', '13:30'] },
        { day: 'viernes', slots: ['15:00', '15:30', '16:00', '16:30'] }
      ]
    },
    {
      nombre: 'Laura',
      apellido: 'Fernández',
      email: 'laura.fernandez@saludya.com',
      telefono: '5545678904',
      password: '12345678',
      role: 'doctor',
      especialidad: 'Pediatría',
      bio: 'Acompaña el crecimiento y bienestar de los más pequeños.',
      rating: 4.9,
      consultas: 410,
      availability: [
        { day: 'lunes', slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
        { day: 'miercoles', slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'] },
        { day: 'viernes', slots: ['14:00', '14:30', '15:00', '15:30'] }
      ]
    },
    {
      nombre: 'Pedro',
      apellido: 'López',
      email: 'pedro.lopez@saludya.com',
      telefono: '5556789015',
      password: '12345678',
      role: 'doctor',
      especialidad: 'Neurología',
      bio: 'Diagnostica y trata las condiciones del sistema nervioso.',
      rating: 4.8,
      consultas: 290,
      availability: [
        { day: 'martes', slots: ['09:00', '09:30', '10:00', '10:30', '11:00'] },
        { day: 'jueves', slots: ['15:00', '15:30', '16:00', '16:30', '17:00'] },
        { day: 'viernes', slots: ['09:00', '09:30', '10:00', '10:30'] }
      ]
    },
    {
      nombre: 'Roberto',
      apellido: 'Silva',
      email: 'roberto.silva@saludya.com',
      telefono: '5567890126',
      password: '12345678',
      role: 'doctor',
      especialidad: 'Traumatología',
      bio: 'Ayuda en lesiones musculoesqueléticas con tratamientos personalizados.',
      rating: 4.6,
      consultas: 170,
      availability: [
        { day: 'miercoles', slots: ['10:00', '10:30', '11:00', '11:30', '12:00'] },
        { day: 'jueves', slots: ['14:00', '14:30', '15:00', '15:30', '16:00'] },
        { day: 'viernes', slots: ['09:00', '09:30', '10:00', '10:30'] }
      ]
    }
  ];

  const admin = {
    nombre: 'Admin',
    apellido: 'SaludYa',
    email: 'admin@saludya.com',
    telefono: '0000000000',
    password: 'admin123',
    role: 'admin',
    bio: 'Administrador del sistema',
    rating: 5.0,
    consultas: 0,
    availability: []
  };

  const seedList = [...doctors, admin];

  for (const userData of seedList) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      if (!/^(\$2[aby]\$)/.test(existing.password)) {
        existing.password = await bcrypt.hash(existing.password, 10);
        await existing.save();
      }
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({
      ...userData,
      password: hashedPassword
    });
  }

  console.log('Semilla de usuarios cargada.');
};

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB conectado');
    await seedUsers();
    app.listen(PORT, () => {
      console.log(`Servidor API iniciado en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  });
