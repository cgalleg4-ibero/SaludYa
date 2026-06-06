import { useState } from 'react';
import { loginUser } from '../api';
import { success as notifySuccess, error as notifyError } from '../utils/notify';

interface LoginProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: (token: string, profile: { _id: string; nombre: string; apellido: string; email: string; telefono: string; role: 'patient' | 'doctor' }) => void;
}

export function Login({ onSwitchToRegister, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email: username, password, role: userType });
      notifySuccess('Bienvenido', `${response.user.nombre} ${response.user.apellido}`);
      onLoginSuccess(response.token, response.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error iniciando sesión';
      setError(msg);
      notifyError('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mt-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--primary)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 style={{ color: 'var(--foreground)' }}>Sistema Médico</h1>
          <p className="mt-2" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
            Ingrese sus credenciales para continuar
          </p>
        </div>

        <div className="rounded-lg p-8 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="userType" className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                Tipo de Usuario
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value as 'patient' | 'doctor' | 'admin')}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)'
                }}
              >
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label htmlFor="username" className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)'
                }}
                placeholder="Ingrese su correo"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--input-background)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)'
                }}
                placeholder="Ingrese su contraseña"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(222, 53, 11, 0.1)', color: 'var(--destructive)', border: `1px solid var(--destructive)` }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <div className="text-center">
              <a href="#" className="inline-block hover:underline" style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                ¿Olvidó su contraseña?
              </a>
            </div>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: `1px solid var(--border)` }}>
            <p className="text-center mb-3" style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
              ¿No tiene una cuenta?
            </p>
            <button
              onClick={onSwitchToRegister}
              className="w-full px-6 py-3 rounded-lg transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
            >
              Crear Cuenta
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
            ¿Necesita ayuda? Contacte al administrador
          </p>
        </div>
      </div>
    </div>
  );
}
