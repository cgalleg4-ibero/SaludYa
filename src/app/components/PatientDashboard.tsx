import { useEffect, useState } from "react";
import { Calendar, Clock, User, Plus, LogOut, Settings } from "lucide-react";
import { getAppointments, updateAppointment } from "../api";

interface PatientDashboardProps {
  user: { nombre: string; apellido: string };
  onLogout: () => void;
  onNewAppointment: () => void;
  onViewProfile: () => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  status: "pending" | "completed" | "cancelled" | string;
  reason?: string;
  cancelReason?: string | null;
  cancelledBy?: "patient" | "doctor" | "admin" | null;
  cancelledById?: string | null;
}

export function PatientDashboard({
  user,
  onLogout,
  onNewAppointment,
  onViewProfile,
}: PatientDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nextAppointments, setNextAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(
    null,
  );
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAppointments();
        setAppointments(
          Array.isArray(data)
            ? data
                .sort((a, b) => {
                  if (a.date === b.date) return a.time.localeCompare(b.time);
                  return a.date.localeCompare(b.date);
                })
                .filter((appointment) => {
                  const appointmentDateTime = new Date(
                    `${appointment.date}T${appointment.time}`,
                  );
                  const status = appointment.status.toLowerCase();
                  if (status !== "pending" || appointmentDateTime < new Date())
                    return true;
                })
            : [],
        );
        setNextAppointments(
          Array.isArray(data)
            ? data
                .filter((appointment) => {
                  const status = appointment.status.toLowerCase();
                  if (status !== "pending") return false;
                  const appointmentDateTime = new Date(
                    `${appointment.date}T${appointment.time}`,
                  );
                  return appointmentDateTime >= new Date();
                })
                .sort()
            : [],
        );
        console.log("Citas cargadas:", data);
        console.log("Próximas citas:", nextAppointments);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las citas",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "completada":
        return "var(--secondary)";
      case "pending":
      case "pendiente":
        return "var(--accent)";
      case "cancelled":
      case "cancelada":
        return "var(--destructive)";
      default:
        return "var(--muted)";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "completada":
        return "Completada";
      case "pending":
      case "pendiente":
        return "Pendiente";
      case "cancelled":
      case "cancelada":
        return "Cancelada";
      default:
        return status;
    }
  };

  const handleStartEditing = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
    setEditReason(appointment.reason || "");
    setActionError("");
    setActionSuccess("");
  };

  const handleCancelEditing = () => {
    setEditingAppointmentId(null);
    setEditDate("");
    setEditTime("");
    setEditReason("");
    setActionError("");
  };

  const handleSaveEdit = async (appointmentId: string) => {
    if (!editDate || !editTime) {
      setActionError("Fecha y hora son obligatorias.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await updateAppointment(appointmentId, {
        date: editDate,
        time: editTime,
        reason: editReason,
      });

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                date: editDate,
                time: editTime,
                reason: editReason,
              }
            : appointment,
        ),
      );

      setActionSuccess("Cita actualizada correctamente.");
      handleCancelEditing();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo actualizar la cita",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelModal = (appointmentId: string) => {
    setCancelAppointmentId(appointmentId);
    setCancelReasonInput("");
    setActionError("");
    setActionSuccess("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancelAppointment = async () => {
    if (!cancelAppointmentId) {
      setActionError("No se pudo identificar la cita a cancelar.");
      return;
    }

    const cancelReason = cancelReasonInput.trim();
    if (!cancelReason) {
      setActionError("El motivo de cancelación es obligatorio.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await updateAppointment(cancelAppointmentId, {
        status: "cancelled",
        cancelReason,
      });
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === cancelAppointmentId
            ? { ...appointment, status: "cancelled", cancelReason }
            : appointment,
        ),
      );
      setActionSuccess("Cita cancelada correctamente.");
      if (editingAppointmentId === cancelAppointmentId) {
        handleCancelEditing();
      }
      setCancelModalOpen(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo cancelar la cita",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const confirmedCount = appointments.filter(
    (appointment: Appointment) => appointment.status === "completed",
  ).length;
  const pendingCount = appointments.filter(
    (appointment: Appointment) => appointment.status === "pending",
  ).length;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <header className="shadow-sm" style={{ backgroundColor: "var(--card)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "var(--text-h2)",
                    color: "var(--foreground)",
                  }}
                >
                  Sistema Médico
                </h2>
                <p
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Panel de Paciente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onViewProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                <Settings size={18} />
                <span style={{ fontSize: "var(--text-body)" }}>Mi Perfil</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--destructive)",
                  border: `1px solid var(--destructive)`,
                }}
              >
                <LogOut size={18} />
                <span style={{ fontSize: "var(--text-body)" }}>
                  Cerrar Sesión
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setCancelModalOpen(false)}
            />
            <div
              className="relative w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg"
              style={{ backgroundColor: "var(--card)" }}
            >
              <div className="mb-4">
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    color: "var(--foreground)",
                  }}
                >
                  Cancelar cita
                </h3>
                <p
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "var(--text-sm)",
                    marginTop: 4,
                  }}
                >
                  Ingrese el motivo de cancelación para esta cita.
                </p>
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="cancel-reason"
                  className="block text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Motivo de cancelación
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReasonInput}
                  onChange={(event) => setCancelReasonInput(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border p-3"
                  style={{
                    backgroundColor: "var(--input)",
                    color: "var(--foreground)",
                    borderColor: "var(--border)",
                  }}
                />
                {actionError && (
                  <p
                    style={{
                      color: "var(--destructive)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {actionError}
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-lg px-4 py-2 transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: "var(--muted)",
                    color: "var(--foreground)",
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelAppointment}
                  disabled={!cancelReasonInput.trim()}
                  className="rounded-lg px-4 py-2 transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: !cancelReasonInput.trim()
                      ? "var(--muted)"
                      : "var(--destructive)",
                    color: !cancelReasonInput.trim()
                      ? "var(--foreground)"
                      : "var(--destructive-foreground)",
                  }}
                >
                  Confirmar cancelación
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 style={{ color: "var(--foreground)" }}>
            Bienvenido, {user.nombre} {user.apellido}
          </h1>
          <p
            className="mt-2"
            style={{
              fontSize: "var(--text-body)",
              color: "var(--muted-foreground)",
            }}
          >
            Gestione sus citas médicas de forma sencilla
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 hover:opacity-90 shadow-md"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <Plus size={20} />
            <span style={{ fontSize: "var(--text-body)" }}>Nueva Cita</span>
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: "var(--foreground)" }}>Próximas Citas</h2>
            <span
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
                fontSize: "var(--text-caption)",
              }}
            >
              {nextAppointments.length} cita
              {nextAppointments.length === 1 ? "" : "s"} programada
              {nextAppointments.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ backgroundColor: "var(--card)" }}
            >
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--muted-foreground)",
                }}
              >
                Cargando citas...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ backgroundColor: "var(--card)" }}
            >
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--destructive)",
                }}
              >
                {error}
              </p>
            </div>
          ) : nextAppointments.length === 0 ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ backgroundColor: "var(--card)" }}
            >
              <Calendar
                size={48}
                style={{
                  color: "var(--muted-foreground)",
                  margin: "0 auto 16px",
                }}
              />
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--muted-foreground)",
                }}
              >
                No tiene citas programadas
              </p>
              {appointments.length === 0 && (
                <button
                  onClick={onNewAppointment}
                  className="mt-4 px-6 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Agendar Primera Cita
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {actionError && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: "rgba(248, 113, 113, 0.12)",
                    color: "var(--destructive)",
                  }}
                >
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    color: "var(--secondary)",
                  }}
                >
                  {actionSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nextAppointments.map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg p-6 shadow-md transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: "var(--card)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-white"
                        style={{
                          backgroundColor: getStatusColor(appointment.status),
                          fontSize: "var(--text-caption)",
                        }}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    {editingAppointmentId === appointment.id ? (
                      <div className="space-y-4">
                        <div>
                          <label
                            className="block mb-1"
                            style={{
                              color: "var(--muted-foreground)",
                              fontSize: "var(--text-caption)",
                            }}
                          >
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(event) =>
                              setEditDate(event.target.value)
                            }
                            className="w-full rounded-lg border p-3"
                            style={{
                              backgroundColor: "var(--input)",
                              color: "var(--foreground)",
                              borderColor: "var(--border)",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            className="block mb-1"
                            style={{
                              color: "var(--muted-foreground)",
                              fontSize: "var(--text-caption)",
                            }}
                          >
                            Hora
                          </label>
                          <input
                            type="time"
                            value={editTime}
                            onChange={(event) =>
                              setEditTime(event.target.value)
                            }
                            className="w-full rounded-lg border p-3"
                            style={{
                              backgroundColor: "var(--input)",
                              color: "var(--foreground)",
                              borderColor: "var(--border)",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            className="block mb-1"
                            style={{
                              color: "var(--muted-foreground)",
                              fontSize: "var(--text-caption)",
                            }}
                          >
                            Motivo
                          </label>
                          <textarea
                            value={editReason}
                            onChange={(event) =>
                              setEditReason(event.target.value)
                            }
                            className="w-full rounded-lg border p-3 resize-none"
                            rows={3}
                            style={{
                              backgroundColor: "var(--input)",
                              color: "var(--foreground)",
                              borderColor: "var(--border)",
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(appointment.id)}
                            disabled={actionLoading}
                            className="flex-1 px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-90"
                            style={{
                              backgroundColor: "var(--primary)",
                              color: "var(--primary-foreground)",
                            }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEditing}
                            disabled={actionLoading}
                            className="flex-1 px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-80"
                            style={{
                              backgroundColor: "var(--muted)",
                              color: "var(--foreground)",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar
                              size={16}
                              style={{ color: "var(--primary)" }}
                            />
                            <p
                              style={{
                                fontSize: "var(--text-body)",
                                color: "var(--foreground)",
                              }}
                            >
                              {formatDate(appointment.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock
                              size={16}
                              style={{ color: "var(--primary)" }}
                            />
                            <p
                              style={{
                                fontSize: "var(--text-body)",
                                color: "var(--foreground)",
                              }}
                            >
                              {appointment.time}
                            </p>
                          </div>
                        </div>

                        <div
                          className="pt-4"
                          style={{ borderTop: `1px solid var(--border)` }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                              style={{ backgroundColor: "var(--muted)" }}
                            >
                              <User
                                size={20}
                                style={{ color: "var(--muted-foreground)" }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                style={{
                                  fontSize: "var(--text-body)",
                                  color: "var(--foreground)",
                                }}
                              >
                                {appointment.doctor}
                              </p>
                              <p
                                style={{
                                  fontSize: "var(--text-caption)",
                                  color: "var(--muted-foreground)",
                                }}
                              >
                                {appointment.specialty}
                              </p>
                              <p
                                className="mt-3"
                                style={{
                                  fontSize: "var(--text-body)",
                                  color: "var(--foreground)",
                                }}
                              >
                                {appointment.reason ||
                                  "Sin motivo especificado"}
                              </p>
                              {appointment.status === "cancelled" &&
                                appointment.cancelReason && (
                                  <p
                                    className="mt-2"
                                    style={{
                                      fontSize: "var(--text-body)",
                                      color: "var(--destructive)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "var(--muted-foreground)",
                                      }}
                                    >
                                      Motivo de cancelación:
                                    </span>
                                    {appointment.cancelReason}
                                    {appointment.cancelledBy && (
                                      <span
                                        style={{
                                          fontSize: "var(--text-caption)",
                                          color: "var(--muted-foreground)",
                                          marginLeft: 8,
                                        }}
                                      >
                                        Cancelado por:{" "}
                                        {appointment.cancelledBy === "patient"
                                          ? "paciente"
                                          : appointment.cancelledBy === "doctor"
                                            ? "doctor"
                                            : appointment.cancelledBy ===
                                                "admin"
                                              ? "administrador"
                                              : appointment.cancelledBy}
                                      </span>
                                    )}
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          {(appointment.status === "pending" ||
                            appointment.status === "confirmed") && (
                            <>
                              <button
                                onClick={() => handleStartEditing(appointment)}
                                className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                                style={{
                                  backgroundColor: "var(--primary)",
                                  color: "var(--primary-foreground)",
                                  fontSize: "var(--text-caption)",
                                }}
                              >
                                Modificar
                              </button>
                              <button
                                onClick={() => openCancelModal(appointment.id)}
                                className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
                                style={{
                                  backgroundColor: "transparent",
                                  color: "var(--destructive)",
                                  border: `1px solid var(--destructive)`,
                                  fontSize: "var(--text-caption)",
                                }}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: "var(--foreground)" }}>Historial de Citas</h2>
          </div>

          {loading ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ backgroundColor: "var(--card)" }}
            >
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--muted-foreground)",
                }}
              >
                Cargando citas...
              </p>
            </div>
          ) : error ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ backgroundColor: "var(--card)" }}
            >
              <p
                style={{
                  fontSize: "var(--text-body)",
                  color: "var(--destructive)",
                }}
              >
                {error}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actionError && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: "rgba(248, 113, 113, 0.12)",
                    color: "var(--destructive)",
                  }}
                >
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    color: "var(--secondary)",
                  }}
                >
                  {actionSuccess}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg p-6 shadow-md transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: "var(--card)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-white"
                        style={{
                          backgroundColor: getStatusColor(appointment.status),
                          fontSize: "var(--text-caption)",
                        }}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar
                          size={16}
                          style={{ color: "var(--primary)" }}
                        />
                        <p
                          style={{
                            fontSize: "var(--text-body)",
                            color: "var(--foreground)",
                          }}
                        >
                          {formatDate(appointment.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} style={{ color: "var(--primary)" }} />
                        <p
                          style={{
                            fontSize: "var(--text-body)",
                            color: "var(--foreground)",
                          }}
                        >
                          {appointment.time}
                        </p>
                      </div>
                    </div>

                    <div
                      className="pt-4"
                      style={{ borderTop: `1px solid var(--border)` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                          style={{ backgroundColor: "var(--muted)" }}
                        >
                          <User
                            size={20}
                            style={{ color: "var(--muted-foreground)" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontSize: "var(--text-body)",
                              color: "var(--foreground)",
                            }}
                          >
                            {appointment.doctor}
                          </p>
                          <p
                            style={{
                              fontSize: "var(--text-caption)",
                              color: "var(--muted-foreground)",
                            }}
                          >
                            {appointment.specialty}
                          </p>
                          <p
                            className="mt-3"
                            style={{
                              fontSize: "var(--text-body)",
                              color: "var(--foreground)",
                            }}
                          >
                            {appointment.reason || "Sin motivo especificado"}
                          </p>
                          {appointment.status === "cancelled" &&
                            appointment.cancelReason && (
                              <p
                                className="mt-2"
                                style={{
                                  fontSize: "var(--text-body)",
                                  color: "var(--destructive)",
                                }}
                              >
                                <span
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  Motivo de cancelación:
                                </span>
                                {appointment.cancelReason}
                                {appointment.cancelledBy && (
                                  <span
                                    style={{
                                      fontSize: "var(--text-caption)",
                                      color: "var(--muted-foreground)",
                                      marginLeft: 8,
                                    }}
                                  >
                                    Cancelado por:{" "}
                                    {appointment.cancelledBy === "patient"
                                      ? "paciente"
                                      : appointment.cancelledBy === "doctor"
                                        ? "doctor"
                                        : appointment.cancelledBy === "admin"
                                          ? "administrador"
                                          : appointment.cancelledBy}
                                  </span>
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Citas Totales
                </p>
                <p
                  style={{
                    fontSize: "var(--text-h1)",
                    color: "var(--foreground)",
                  }}
                >
                  {appointments.length}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: "rgba(0, 82, 204, 0.1)" }}
              >
                <Calendar size={24} style={{ color: "var(--primary)" }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Completadas
                </p>
                <p
                  style={{
                    fontSize: "var(--text-h1)",
                    color: "var(--foreground)",
                  }}
                >
                  {confirmedCount}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: "rgba(54, 179, 126, 0.1)" }}
              >
                <Clock size={24} style={{ color: "var(--secondary)" }} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Pendientes
                </p>
                <p
                  style={{
                    fontSize: "var(--text-h1)",
                    color: "var(--foreground)",
                  }}
                >
                  {pendingCount}
                </p>
              </div>
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: "rgba(0, 184, 217, 0.1)" }}
              >
                <User size={24} style={{ color: "var(--accent)" }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
