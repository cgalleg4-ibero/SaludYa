import { useState } from 'react';
import { registerUser } from '../api';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  password?: string;
  confirmPassword?: string;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    tipoUsuario: 'patient',
    especialidad: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono.replace(/\s|-/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme su contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
        role: formData.tipoUsuario,
        especialidad: formData.tipoUsuario === 'doctor' ? formData.especialidad : ''
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSwitchToLogin();
      }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error registrando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--secondary)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 style={{ color: 'var(--foreground)' }}>Crear Cuenta</h1>
          <p className="mt-2" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
            Complete el formulario para registrarse
          </p>
        </div>

        <div className="rounded-lg p-8 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
          {showSuccess && (
            <div className="mb-4 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(54, 179, 126, 0.1)', color: 'var(--secondary)', border: `1px solid var(--secondary)` }}>
              Cuenta creada exitosamente. Redirigiendo a inicio de sesión...
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(222, 53, 11, 0.1)', color: 'var(--destructive)', border: `1px solid var(--destructive)` }}>
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="nombre"
                  className="block mb-2"
                  style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
                >
                  Nombre <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.nombre ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                  placeholder="Juan"
                />
                {errors.nombre && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="apellido"
                  className="block mb-2"
                  style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
                >
                  Apellido <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  id="apellido"
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => handleChange('apellido', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.apellido ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                  placeholder="Pérez"
                />
                {errors.apellido && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.apellido}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block mb-2"
                style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
              >
                Email <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid ${errors.email ? 'var(--destructive)' : 'var(--border)'}`,
                  color: 'var(--foreground)'
                }}
                placeholder="juan.perez@example.com"
              />
              {errors.email && (
                <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="block mb-2"
                style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
              >
                Teléfono <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid ${errors.telefono ? 'var(--destructive)' : 'var(--border)'}`,
                  color: 'var(--foreground)'
                }}
                placeholder="5512345678"
              />
              {errors.telefono && (
                <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                  {errors.telefono}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tipoUsuario"
                className="block mb-2"
                style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
              >
                Tipo de Usuario
              </label>
              <select
                id="tipoUsuario"
                value={formData.tipoUsuario}
                onChange={(e) => handleChange('tipoUsuario', e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)'
                }}
              >
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
              </select>
            </div>

            {formData.tipoUsuario === 'doctor' && (
              <div>
                <label
                  htmlFor="especialidad"
                  className="block mb-2"
                  style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
                >
                  Especialidad
                </label>
                <input
                  id="especialidad"
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => handleChange('especialidad', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                  placeholder="Cardiología"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2"
                  style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
                >
                  Contraseña <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.password ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2"
                  style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}
                >
                  Confirmar Contraseña <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.confirmPassword ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                  placeholder="Repita su contraseña"
                />
                {errors.confirmPassword && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {showSuccess && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(54, 179, 126, 0.1)',
                  color: 'var(--secondary)',
                  border: `1px solid var(--secondary)`
                }}
              >
                ¡Registro exitoso! Redirigiendo al login...
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--secondary-foreground)'
              }}
            >
              Registrarse
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: `1px solid var(--border)` }}>
            <p className="mb-3" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
              ¿Ya tiene una cuenta?
            </p>
            <button
              onClick={onSwitchToLogin}
              className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                border: `1px solid var(--primary)`
              }}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
