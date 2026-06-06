import { useEffect, useState } from 'react';
import { User, Save, ArrowLeft, Plus, X } from 'lucide-react';
import { getProfile, updateProfile } from '../api';
import { success as notifySuccess, error as notifyError } from '../utils/notify';

interface UserProfileProps {
  onBack: () => void;
}

interface ProfileData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  grupoSanguineo: string;
}

interface MedicalHistory {
  alergias: string[];
  enfermedadesCronicas: string[];
  medicamentosActuales: string[];
  cirugiasPrevias: string[];
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
}

export function UserProfile({ onBack }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'medical'>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null);
  const [originalMedicalHistory, setOriginalMedicalHistory] = useState<MedicalHistory | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    grupoSanguineo: ''
  });

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    alergias: [],
    enfermedadesCronicas: [],
    medicamentosActuales: [],
    cirugiasPrevias: [],
    contactoEmergencia: {
      nombre: '',
      telefono: '',
      relacion: ''
    }
  });

  const [newItem, setNewItem] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const user = await getProfile();

        setProfileData({
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          email: user.email || '',
          telefono: user.telefono || '',
          fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.substring(0, 10) : '',
          genero: user.genero || '',
          direccion: user.direccion || '',
          ciudad: user.ciudad || '',
          codigoPostal: user.codigoPostal || '',
          grupoSanguineo: user.grupoSanguineo || ''
        });

        const loadedProfileData = {
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          email: user.email || '',
          telefono: user.telefono || '',
          fechaNacimiento: user.fechaNacimiento ? user.fechaNacimiento.substring(0, 10) : '',
          genero: user.genero || '',
          direccion: user.direccion || '',
          ciudad: user.ciudad || '',
          codigoPostal: user.codigoPostal || '',
          grupoSanguineo: user.grupoSanguineo || ''
        };

        const loadedMedicalHistory = {
          alergias: user.medicalHistory?.alergias || [],
          enfermedadesCronicas: user.medicalHistory?.enfermedadesCronicas || [],
          medicamentosActuales: user.medicalHistory?.medicamentosActuales || [],
          cirugiasPrevias: user.medicalHistory?.cirugiasPrevias || [],
          contactoEmergencia: {
            nombre: user.medicalHistory?.contactoEmergencia?.nombre || '',
            telefono: user.medicalHistory?.contactoEmergencia?.telefono || '',
            relacion: user.medicalHistory?.contactoEmergencia?.relacion || ''
          }
        };

        setProfileData(loadedProfileData);
        setMedicalHistory(loadedMedicalHistory);
        setOriginalProfileData(loadedProfileData);
        setOriginalMedicalHistory(loadedMedicalHistory);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'No se pudo cargar el perfil';
        notifyError('Error', msg);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmergencyContactChange = (field: keyof MedicalHistory['contactoEmergencia'], value: string) => {
    setMedicalHistory(prev => ({
      ...prev,
      contactoEmergencia: { ...prev.contactoEmergencia, [field]: value }
    }));
  };

  const addMedicalItem = (category: keyof Omit<MedicalHistory, 'contactoEmergencia'>) => {
    if (!newItem.trim()) return;

    setMedicalHistory(prev => ({
      ...prev,
      [category]: [...prev[category], newItem.trim()]
    }));
    setNewItem('');
  };

  const removeMedicalItem = (category: keyof Omit<MedicalHistory, 'contactoEmergencia'>, index: number) => {
    setMedicalHistory(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const validatePersonalData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (!profileData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }
    if (!profileData.email.trim() || !/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!profileData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = (): boolean => {
    if (!originalProfileData || !originalMedicalHistory) return false;
    return JSON.stringify(profileData) !== JSON.stringify(originalProfileData) ||
      JSON.stringify(medicalHistory) !== JSON.stringify(originalMedicalHistory);
  };

  const handleCancel = () => {
    if (originalProfileData && originalMedicalHistory) {
      setProfileData(originalProfileData);
      setMedicalHistory(originalMedicalHistory);
    }
    setErrors({});
    setIsEditing(false);
  };

  const inputDisabled = !isEditing;

  const handleSave = async () => {
    if (activeTab === 'personal') {
      if (!validatePersonalData()) return;
    }

    setSaving(true);

    try {
      await updateProfile({
        ...profileData,
        medicalHistory
      });
      setOriginalProfileData(profileData);
      setOriginalMedicalHistory(medicalHistory);
      setIsEditing(false);
      notifySuccess('Cambios guardados');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar el perfil';
      notifyError('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:opacity-80"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <ArrowLeft size={20} style={{ color: 'var(--foreground)' }} />
              </button>
              <div>
                <h2 style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                  Mi Perfil
                </h2>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Gestione su información personal y médica
                </p>
              </div>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    border: `1px solid var(--border)`
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges()}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Save size={18} />
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                Modificar Perfil
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="rounded-lg p-8 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>Cargando perfil...</p>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="mb-6" style={{ borderBottom: `2px solid var(--border)` }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('personal')}
              className="px-4 py-3 transition-all duration-200"
              style={{
                color: activeTab === 'personal' ? 'var(--primary)' : 'var(--muted-foreground)',
                borderBottom: activeTab === 'personal' ? `3px solid var(--primary)` : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              <span style={{ fontSize: 'var(--text-body)' }}>Datos Personales</span>
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className="px-4 py-3 transition-all duration-200"
              style={{
                color: activeTab === 'medical' ? 'var(--primary)' : 'var(--muted-foreground)',
                borderBottom: activeTab === 'medical' ? `3px solid var(--primary)` : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              <span style={{ fontSize: 'var(--text-body)' }}>Antecedentes Médicos</span>
            </button>
          </div>
        </div>

        {/* Personal Data Tab */}
        {activeTab === 'personal' && (
          <div className="rounded-lg p-8 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex items-center justify-center w-20 h-20 rounded-full"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <User size={40} style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                  {profileData.nombre} {profileData.apellido}
                </h3>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  Paciente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Nombre <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={profileData.nombre}
                  onChange={(e) => handleProfileChange('nombre', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.nombre ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                />
                {errors.nombre && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Apellido <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={profileData.apellido}
                  onChange={(e) => handleProfileChange('apellido', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.apellido ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                />
                {errors.apellido && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.apellido}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Email <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.email ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                />
                {errors.email && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Teléfono <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={profileData.telefono}
                  onChange={(e) => handleProfileChange('telefono', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid ${errors.telefono ? 'var(--destructive)' : 'var(--border)'}`,
                    color: 'var(--foreground)'
                  }}
                />
                {errors.telefono && (
                  <p className="mt-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--destructive)' }}>
                    {errors.telefono}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={profileData.fechaNacimiento}
                  onChange={(e) => handleProfileChange('fechaNacimiento', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Género
                </label>
                <select
                  value={profileData.genero}
                  onChange={(e) => handleProfileChange('genero', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                >
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                  <option value="prefiero-no-decir">Prefiero no decir</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={profileData.direccion}
                  onChange={(e) => handleProfileChange('direccion', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  value={profileData.ciudad}
                  onChange={(e) => handleProfileChange('ciudad', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Código Postal
                </label>
                <input
                  type="text"
                  value={profileData.codigoPostal}
                  onChange={(e) => handleProfileChange('codigoPostal', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                  Grupo Sanguíneo
                </label>
                <select
                  value={profileData.grupoSanguineo}
                  onChange={(e) => handleProfileChange('grupoSanguineo', e.target.value)}
                  disabled={inputDisabled}
                  className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                >
                  <option value="">Seleccionar</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Medical History Tab */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            {/* Alergias */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <h3 className="mb-4" style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                Alergias
              </h3>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMedicalItem('alergias')}
                  placeholder="Agregar alergia"
                  disabled={inputDisabled}
                  className="flex-1 px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
                <button
                  onClick={() => addMedicalItem('alergias')}
                  disabled={inputDisabled}
                  className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.alergias.map((alergia, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(222, 53, 11, 0.1)',
                      color: 'var(--destructive)',
                      border: `1px solid var(--destructive)`
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-body)' }}>{alergia}</span>
                    <button
                      onClick={() => removeMedicalItem('alergias', index)}
                      disabled={inputDisabled}
                      className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {medicalHistory.alergias.length === 0 && (
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                    No hay alergias registradas
                  </p>
                )}
              </div>
            </div>

            {/* Enfermedades Crónicas */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <h3 className="mb-4" style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                Enfermedades Crónicas
              </h3>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMedicalItem('enfermedadesCronicas')}
                  placeholder="Agregar enfermedad crónica"
                  disabled={inputDisabled}
                  className="flex-1 px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
                <button
                  onClick={() => addMedicalItem('enfermedadesCronicas')}
                  disabled={inputDisabled}
                  className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.enfermedadesCronicas.map((enfermedad, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(0, 82, 204, 0.1)',
                      color: 'var(--primary)',
                      border: `1px solid var(--primary)`
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-body)' }}>{enfermedad}</span>
                    <button
                      onClick={() => removeMedicalItem('enfermedadesCronicas', index)}
                      disabled={inputDisabled}
                      className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {medicalHistory.enfermedadesCronicas.length === 0 && (
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                    No hay enfermedades crónicas registradas
                  </p>
                )}
              </div>
            </div>

            {/* Medicamentos Actuales */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <h3 className="mb-4" style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                Medicamentos Actuales
              </h3>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMedicalItem('medicamentosActuales')}
                  placeholder="Agregar medicamento"
                  disabled={inputDisabled}
                  className="flex-1 px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
                <button
                  onClick={() => addMedicalItem('medicamentosActuales')}
                  disabled={inputDisabled}
                  className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.medicamentosActuales.map((medicamento, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(54, 179, 126, 0.1)',
                      color: 'var(--secondary)',
                      border: `1px solid var(--secondary)`
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-body)' }}>{medicamento}</span>
                    <button
                      onClick={() => removeMedicalItem('medicamentosActuales', index)}
                      disabled={inputDisabled}
                      className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {medicalHistory.medicamentosActuales.length === 0 && (
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                    No hay medicamentos actuales registrados
                  </p>
                )}
              </div>
            </div>

            {/* Cirugías Previas */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <h3 className="mb-4" style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                Cirugías Previas
              </h3>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMedicalItem('cirugiasPrevias')}
                  placeholder="Agregar cirugía"
                  disabled={inputDisabled}
                  className="flex-1 px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--input-background)',
                    border: `1px solid var(--border)`,
                    color: 'var(--foreground)'
                  }}
                />
                <button
                  onClick={() => addMedicalItem('cirugiasPrevias')}
                  disabled={inputDisabled}
                  className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.cirugiasPrevias.map((cirugia, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(0, 184, 217, 0.1)',
                      color: 'var(--accent)',
                      border: `1px solid var(--accent)`
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-body)' }}>{cirugia}</span>
                    <button
                      onClick={() => removeMedicalItem('cirugiasPrevias', index)}
                      disabled={inputDisabled}
                      className="hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {medicalHistory.cirugiasPrevias.length === 0 && (
                  <p style={{ fontSize: 'var(--text-body)', color: 'var(--muted-foreground)' }}>
                    No hay cirugías previas registradas
                  </p>
                )}
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--card)' }}>
              <h3 className="mb-4" style={{ fontSize: 'var(--text-h2)', color: 'var(--foreground)' }}>
                Contacto de Emergencia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={medicalHistory.contactoEmergencia.nombre}
                    onChange={(e) => handleEmergencyContactChange('nombre', e.target.value)}
                    disabled={inputDisabled}
                    className="w-full px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--input-background)',
                      border: `1px solid var(--border)`,
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={medicalHistory.contactoEmergencia.telefono}
                    onChange={(e) => handleEmergencyContactChange('telefono', e.target.value)}
                    disabled={inputDisabled}
                    className="w-full px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--input-background)',
                      border: `1px solid var(--border)`,
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2" style={{ fontSize: 'var(--text-body)', color: 'var(--foreground)' }}>
                    Relación
                  </label>
                  <input
                    type="text"
                    value={medicalHistory.contactoEmergencia.relacion}
                    onChange={(e) => handleEmergencyContactChange('relacion', e.target.value)}
                    disabled={inputDisabled}
                    className="w-full px-4 py-2 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--input-background)',
                      border: `1px solid var(--border)`,
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
