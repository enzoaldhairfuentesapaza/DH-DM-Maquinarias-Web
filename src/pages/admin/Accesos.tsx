import { normalize } from "./excelFiles";
import ExcelTools from "./ExcelTools";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { Search, Pencil, Trash2, ShieldOff, ShieldCheck, Ban } from "lucide-react";
import { api } from "../../api/client";
import { useAuth, Usuario } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import "./admin.css";

const FILTROS = ["todos", "owner", "admin", "cotizador", "cliente"] as const;
const FILTRO_LABEL: Record<(typeof FILTROS)[number], string> = {
  todos: "Todos",
  owner: "Owners",
  admin: "Admins",
  cotizador: "Cotizadores",
  cliente: "Clientes registrados",
};

type EditForm = {
  nombre: string;
  email: string;
  telefono: string;
  tipo_documento: string;
  numero_documento: string;
  razon_social: string;
  password: string;
  rol: "cliente" | "admin" | "owner" | "cotizador";
};

const EMPTY_EDIT: EditForm = {
  nombre: "",
  email: "",
  telefono: "",
  tipo_documento: "",
  numero_documento: "",
  razon_social: "",
  password: "",
  rol: "cliente",
};

export default function Accesos() {
  const { user: currentUser } = useAuth();
  const feedback = useFeedback();
  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todos");

  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "owner" | "cotizador">("admin");
  const [saving, setSaving] = useState(false);

  // Edicion de un usuario existente (cualquier rol)
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Usuario[]>("/api/accesos/");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  async function handleCrear(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/accesos/", { nombre, email, password, rol });
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("admin");
      setShowForm(false);
      load();
      feedback.success(`Se creó el acceso de ${nombre} con rol ${rol}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear acceso");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevocarRol(id: number) {
    const ok = await feedback.confirm({
      title: "¿Revocar el rol administrativo?",
      message: "El usuario pasará a rol cliente; su cuenta no se borra, solo pierde el acceso al panel.",
      confirmLabel: "Sí, revocar",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/accesos/${id}/rol`);
      load();
      feedback.success("Se revocó el rol administrativo del usuario.");
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al revocar el rol");
    }
  }

  async function handleToggleAcceso(u: Usuario) {
    const accion = u.activo ? "quitar el acceso a" : "restaurar el acceso a";
    const ok = await feedback.confirm({
      title: u.activo ? "Quitar acceso" : "Restaurar acceso",
      message: `¿Seguro que quieres ${accion} ${u.nombre}?`,
      confirmLabel: u.activo ? "Sí, quitar acceso" : "Sí, restaurar",
      danger: u.activo,
    });
    if (!ok) return;
    try {
      await api.put(`/api/accesos/${u.id}/activo`, { activo: !u.activo });
      load();
      feedback.success(u.activo ? `Se le quitó el acceso a ${u.nombre}.` : `Se restauró el acceso de ${u.nombre}.`);
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al actualizar el acceso");
    }
  }

  async function handleEliminar(u: Usuario) {
    const ok = await feedback.confirm({
      title: "Eliminar cuenta permanentemente",
      message: `¿Eliminar PERMANENTEMENTE la cuenta de ${u.nombre} (${u.email})? Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/accesos/${u.id}`);
      load();
      feedback.success(`Se eliminó la cuenta de ${u.nombre}.`);
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : "Error al eliminar el usuario");
    }
  }

  function abrirEdicion(u: Usuario) {
    setEditandoId(u.id);
    setEditError("");
    setEditForm({
      nombre: u.nombre || "",
      email: u.email || "",
      telefono: u.telefono || "",
      tipo_documento: u.tipo_documento || "",
      numero_documento: u.numero_documento || "",
      razon_social: u.razon_social || "",
      password: "",
      rol: u.rol,
    });
  }

  function cerrarEdicion() {
    setEditandoId(null);
    setEditForm(EMPTY_EDIT);
    setEditError("");
  }

  async function handleGuardarEdicion(e: FormEvent) {
    e.preventDefault();
    if (editandoId === null) return;
    setEditSaving(true);
    setEditError("");
    try {
      const usuarioOriginal = items.find((u) => u.id === editandoId);

      await api.put(`/api/accesos/${editandoId}`, {
        nombre: editForm.nombre,
        email: editForm.email,
        telefono: editForm.telefono,
        tipo_documento: editForm.tipo_documento,
        numero_documento: editForm.numero_documento,
        razon_social: editForm.razon_social,
        ...(editForm.password ? { password: editForm.password } : {}),
      });

      // Si tambien cambio el rol y no es la propia cuenta, se actualiza aparte.
      if (
        usuarioOriginal &&
        usuarioOriginal.rol !== editForm.rol &&
        editandoId !== currentUser?.id
      ) {
        await api.put(`/api/accesos/${editandoId}/rol`, { rol: editForm.rol });
      }

      cerrarEdicion();
      load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setEditSaving(false);
    }
  }

  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return items.filter((u) => {
      if (filtro !== "todos" && u.rol !== filtro) return false;
      if (!texto) return true;
      return (
        u.nombre?.toLowerCase().includes(texto) ||
        u.email?.toLowerCase().includes(texto) ||
        (u.telefono ?? "").toLowerCase().includes(texto) ||
        (u.numero_documento ?? "").toLowerCase().includes(texto) ||
        (u.razon_social ?? "").toLowerCase().includes(texto)
      );
    });
  }, [items, filtro, busqueda]);

  const usuarioEditando = items.find((u) => u.id === editandoId) || null;

  // Las cuentas "cliente" son las que la gente crea sola al registrarse en la
  // web. Las cuentas admin/owner/cotizador son las que un owner genera desde
  // este panel. Al owner solo se le deja editar/eliminar las que él generó;
  // a un cliente registrado únicamente se le puede quitar o restaurar el acceso.
  function esCuentaGenerada(u: Usuario) {
    return u.rol !== "cliente";
  }

  return (
    <div>
      <ExcelTools entity="accesos" onImported={() => window.location.reload()} />
      <div className="admin-header-row">
        <h1>Administrar Accesos</h1>
        <button
          className="btn-admin yellow"
          onClick={() => setShowForm((s) => !s)}
          data-tooltip="Crea un nuevo acceso de admin, owner o cotizador"
        >
          {showForm ? "Cancelar" : "+ Agregar acceso"}
        </button>
      </div>

      {normalize(showForm ? nombre : editForm.nombre) && items.some(u => u.id !== (showForm ? null : editandoId) && normalize(u.nombre) === normalize(showForm ? nombre : editForm.nombre)) && <p className="duplicate-tag" role="status">Ya existe un usuario con el mismo nombre.</p>}
      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <form className="admin-form" onSubmit={handleCrear} style={{ marginBottom: 24 }}>
          <label>
            Nombre
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label>
            Correo
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Contraseña
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label>
            Rol
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as "admin" | "owner" | "cotizador")}
            >
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="cotizador">Cotizador</option>
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-admin yellow" disabled={saving}>
              {saving ? "Creando..." : "Crear acceso"}
            </button>
          </div>
        </form>
      )}

      {usuarioEditando && (
        <div className="accesos-edit-overlay" onClick={cerrarEdicion}>
          <form
            className="admin-form accesos-edit-box"
            onSubmit={handleGuardarEdicion}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Editar usuario: {usuarioEditando.nombre}</h3>
            {editError && <div className="admin-error">{editError}</div>}

            <label>
              Nombre
              <input
                type="text"
                required
                value={editForm.nombre}
                onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </label>
            <label>
              Correo
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              Teléfono
              <input
                type="text"
                value={editForm.telefono}
                onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </label>
            <label>
              Tipo de documento
              <select
                value={editForm.tipo_documento}
                onChange={(e) => setEditForm((f) => ({ ...f, tipo_documento: e.target.value }))}
              >
                <option value="">Sin especificar</option>
                <option value="dni">DNI</option>
                <option value="ruc">RUC</option>
              </select>
            </label>
            <label>
              Número de documento
              <input
                type="text"
                value={editForm.numero_documento}
                onChange={(e) => setEditForm((f) => ({ ...f, numero_documento: e.target.value }))}
              />
            </label>
            <label>
              Razón social
              <input
                type="text"
                value={editForm.razon_social}
                onChange={(e) => setEditForm((f) => ({ ...f, razon_social: e.target.value }))}
              />
            </label>
            <label>
              Nueva contraseña (opcional)
              <input
                type="password"
                placeholder="Dejar en blanco para no cambiarla"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              />
            </label>
            <label>
              Rol
              <select
                value={editForm.rol}
                disabled={editandoId === currentUser?.id}
                onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value as EditForm["rol"] }))}
              >
                <option value="cliente">Cliente</option>
                <option value="cotizador">Cotizador</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            {editandoId === currentUser?.id && (
              <p style={{ fontSize: 12.5, color: "#888" }}>
                No puedes cambiar tu propio rol.
              </p>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="btn-admin yellow" disabled={editSaving}>
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" className="btn-admin" onClick={cerrarEdicion}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo, teléfono o documento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="admin-tabs">
        {FILTROS.map((f) => (
          <button key={f} className={filtro === f ? "active" : ""} onClick={() => setFiltro(f)}>
            {FILTRO_LABEL[f]}
            {f !== "todos" && ` (${items.filter((u) => u.rol === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p>No hay usuarios en este filtro.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => (
                <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.55 }}>
                  <td>{u.nombre}{items.filter(other => normalize(other.nombre) === normalize(u.nombre)).length > 1 && <span className="duplicate-tag">Ya existe un usuario con el mismo nombre</span>}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`rol-badge ${u.rol}`}>{u.rol}</span>
                  </td>
                  <td>
                    <span className={`rol-badge ${u.activo ? "cliente" : "danger"}`}>
                      {u.activo ? "Activo" : "Sin acceso"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {esCuentaGenerada(u) ? (
                      <button
                        className="access-icon-action"
                        aria-label={`Editar acceso de ${u.nombre}`} title="Editar datos, contraseña o rol"
                        onClick={() => abrirEdicion(u)}
                        data-tooltip="Edita los datos, la contraseña o el rol de esta cuenta"
                      >
                        <Pencil size={15} />
                      </button>
                    ) : (
                      <span
                        className="rol-badge cliente"
                        data-tooltip="Es una cuenta que el cliente creó solo; solo puedes quitarle o restaurarle el acceso"
                      >
                        Registrado por el cliente
                      </span>
                    )}

                    {u.id !== currentUser?.id && (
                      <button
                        className="access-icon-action"
                        aria-label={`${u.activo ? "Quitar" : "Restaurar"} acceso de ${u.nombre}`} title={u.activo ? "Quitar acceso" : "Restaurar acceso"}
                        onClick={() => handleToggleAcceso(u)}
                        data-tooltip={
                          u.activo
                            ? "Bloquea el ingreso de este usuario sin borrar su cuenta"
                            : "Vuelve a permitirle el ingreso a este usuario"
                        }
                      >
                        {u.activo ? <Ban size={15} /> : <ShieldCheck size={15} />}
                      </button>
                    )}

                    {u.rol !== "cliente" && u.id !== currentUser?.id && (
                      <button
                        className="access-icon-action danger"
                        aria-label={`Revocar rol de ${u.nombre}`} title="Revocar rol administrativo"
                        onClick={() => handleRevocarRol(u.id)}
                        data-tooltip="Quita el rol administrativo y lo deja como cliente (no borra la cuenta)"
                      >
                        <ShieldOff size={15} />
                      </button>
                    )}

                    {esCuentaGenerada(u) && u.id !== currentUser?.id && (
                      <button
                        className="access-icon-action danger"
                        aria-label={`Eliminar cuenta de ${u.nombre}`} title="Eliminar cuenta permanentemente"
                        onClick={() => handleEliminar(u)}
                        data-tooltip="Borra la cuenta para siempre; no se puede deshacer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
