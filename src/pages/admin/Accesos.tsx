import { useEffect, useMemo, useState, FormEvent } from "react";
import { api } from "../../api/client";
import { useAuth, Usuario } from "../../context/AuthContext";
import "./admin.css";

const FILTROS = ["todos", "owner", "admin", "cliente"] as const;
const FILTRO_LABEL: Record<(typeof FILTROS)[number], string> = {
  todos: "Todos",
  owner: "Owners",
  admin: "Admins",
  cliente: "Clientes registrados",
};

export default function Accesos() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todos");

  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "owner">("admin");
  const [saving, setSaving] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear acceso");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevocar(id: number) {
    if (!confirm("¿Revocar el acceso administrativo de este usuario? Pasará a rol cliente.")) {
      return;
    }
    try {
      await api.delete(`/api/accesos/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al revocar acceso");
    }
  }

  const visibles = useMemo(
    () => (filtro === "todos" ? items : items.filter((u) => u.rol === filtro)),
    [items, filtro]
  );

  return (
    <div>
      <div className="admin-header-row">
        <h1>Administrar Accesos</h1>
        <button className="btn-admin yellow" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancelar" : "+ Agregar acceso"}
        </button>
      </div>

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
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label>
            Rol
            <select value={rol} onChange={(e) => setRol(e.target.value as "admin" | "owner")}>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-admin yellow" disabled={saving}>
              {saving ? "Creando..." : "Crear acceso"}
            </button>
          </div>
        </form>
      )}

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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`rol-badge ${u.rol}`}>{u.rol}</span>
                  </td>
                  <td>
                    {u.rol !== "cliente" && u.id !== currentUser?.id && (
                      <button className="btn-admin small danger" onClick={() => handleRevocar(u.id)}>
                        Revocar acceso
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
