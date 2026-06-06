const env = import.meta.env as ImportMetaEnv;
const API_BASE = env.VITE_API_BASE || '/api';

type JsonPayload = Record<string, unknown>;

const request = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data && data.message) || 'Error de conexión con el servidor';
    throw new Error(error);
  }

  return data;
};

const getToken = () => localStorage.getItem('saludya_token');

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerUser = async (payload: JsonPayload) => {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const loginUser = async (payload: JsonPayload) => {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const getProfile = async () => {
  return request('/users/me', {
    headers: { ...authHeaders() }
  });
};

export const updateProfile = async (payload: JsonPayload) => {
  return request('/users/me', {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const getDoctors = async (query: Partial<{ specialty: string; search: string }> = {}) => {
  const params = new URLSearchParams();
  if (query.specialty) params.set('specialty', query.specialty);
  if (query.search) params.set('search', query.search);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request(`/doctors${suffix}`, {
    headers: { ...authHeaders() }
  });
};

export const getDoctorProfile = async (doctorId: string) => {
  return request(`/doctors/${doctorId}`, {
    headers: { ...authHeaders() }
  });
};

export const getDoctorSlots = async (doctorId: string, date: string) => {
  return request(`/doctors/${doctorId}/availability?date=${encodeURIComponent(date)}`, {
    headers: { ...authHeaders() }
  });
};

export const updateDoctorAvailability = async (doctorId: string, availability: any) => {
  return request(`/doctors/${doctorId}/availability`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability })
  });
};

export const getAppointments = async () => {
  return request('/appointments', {
    headers: { ...authHeaders() }
  });
};

export const bookAppointment = async (payload: JsonPayload) => {
  return request('/appointments', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const updateAppointment = async (id: string, payload: JsonPayload) => {
  return request(`/appointments/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const deleteAppointment = async (id: string) => {
  return request(`/appointments/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
};

export const getUsers = async () => {
  return request('/admin/users', {
    headers: { ...authHeaders() }
  });
};

export const updateUser = async (id: string, payload: JsonPayload) => {
  return request(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const saveToken = (token: string) => {
  localStorage.setItem('saludya_token', token);
};

export const clearToken = () => {
  localStorage.removeItem('saludya_token');
};
