import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  nombre: { type: String, default: '' },
  telefono: { type: String, default: '' },
  relacion: { type: String, default: '' }
});

const medicalHistorySchema = new mongoose.Schema({
  alergias: { type: [String], default: [] },
  enfermedadesCronicas: { type: [String], default: [] },
  medicamentosActuales: { type: [String], default: [] },
  cirugiasPrevias: { type: [String], default: [] },
  contactoEmergencia: { type: emergencyContactSchema, default: () => ({}) }
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    telefono: { type: String, default: '' },
    especialidad: { type: String, default: '' },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 4.8 },
    consultas: { type: Number, default: 0 },
    availability: {
      type: [
        new mongoose.Schema(
          {
            day: { type: String, required: true },
            slots: { type: [String], default: [] }
          },
          { _id: false }
        )
      ],
      default: []
    },
    fechaNacimiento: { type: Date, default: null },
    genero: { type: String, default: '' },
    direccion: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    codigoPostal: { type: String, default: '' },
    grupoSanguineo: { type: String, default: '' },
    medicalHistory: { type: medicalHistorySchema, default: () => ({}) }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
      }
    }
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
