import { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, API_URL } from "../../api/client";
import { entities } from "./entityConfig";
import "./admin.css";

type FormState = Record<string, any>;

export default function ContentForm() {
  const { entityKey, id } = useParams<{ entityKey: string; id: string }>();
  const config = entityKey ? entities[entityKey] : undefined;
  const isNew = !id || id === "nuevo";
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!config) return;
    const catFields = config.fields.filter((f) => f.type === "category-select" && f.categoryTipo);
    catFields.forEach((f) => {
      api
        .get<{ nombre: string }[]>(`/api/categorias?tipo=${f.categoryTipo}`)
        .then((data) => {
          setCategoryOptions((prev) => ({ ...prev, [f.name]: data.map((c) => c.nombre) }));
        })
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityKey]);

  useEffect(() => {
    if (!config) return;
    if (isNew) {
      const initial: FormState = {};
      config.fields.forEach((f) => {
        if (f.type === "checkbox") initial[f.name] = f.defaultChecked ?? false;
        else if (f.type === "paragraphs") initial[f.name] = [];
        else if (f.type === "tabular") initial[f.name] = [];
        else if (f.type === "select") initial[f.name] = f.options?.[0] ?? "";
        else initial[f.name] = "";
      });
      setForm(initial);
      return;
    }
    (async () => {
      try {
        const data = await api.get<FormState>(`${config.apiPath}/${id}`);
        setForm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityKey, id]);

  function updateField(name: string, value: any) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !config) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post<{ url: string }>("/api/uploads/", fd);
      updateField("imagen", res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      // Normaliza el textarea de parrafos en un array de strings
      config.fields.forEach((f) => {
        if (f.type === "paragraphs" && typeof payload[f.name] === "string") {
          payload[f.name] = payload[f.name]
            .split("\n")
            .map((p: string) => p.trim())
            .filter(Boolean);
        }
        if (f.type === "tabular" && typeof payload[f.name] === "string") {
          const cols = f.tabularColumns ?? [];
          payload[f.name] = payload[f.name]
            .split("\n")
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string) => {
              const parts = line.split("|").map((p) => p.trim());
              const obj: Record<string, string> = {};
              cols.forEach((c, i) => {
                obj[c] = parts[i] ?? "";
              });
              return obj;
            });
        }
        if (f.type === "number" && payload[f.name] !== "" && payload[f.name] != null) {
          payload[f.name] = Number(payload[f.name]);
        }
      });
      delete payload.id;
      delete payload.creado_en;
      delete payload.actualizado_en;

      if (isNew) {
        await api.post(`${config.apiPath}/`, payload);
      } else {
        await api.put(`${config.apiPath}/${id}`, payload);
      }
      navigate(`/admin/${entityKey}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <p>Sección no encontrada.</p>;
  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <div className="admin-header-row">
        <h1>
          {isNew ? `Agregar ${config.singular.toLowerCase()}` : `Editar ${config.singular.toLowerCase()}`}
        </h1>
        <Link to={`/admin/${entityKey}`} className="btn-admin">
          Volver a la lista
        </Link>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        {config.fields.map((f) => {
          if (f.type === "text") {
            return (
              <label key={f.name}>
                {f.label}
                <input
                  type="text"
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => updateField(f.name, e.target.value)}
                />
              </label>
            );
          }
          if (f.type === "textarea") {
            return (
              <label key={f.name}>
                {f.label}
                <textarea
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => updateField(f.name, e.target.value)}
                />
              </label>
            );
          }
          if (f.type === "paragraphs") {
            const value = Array.isArray(form[f.name])
              ? form[f.name].join("\n")
              : form[f.name] ?? "";
            return (
              <label key={f.name}>
                {f.label}
                <textarea
                  style={{ minHeight: 160 }}
                  value={value}
                  onChange={(e) => updateField(f.name, e.target.value)}
                />
              </label>
            );
          }
          if (f.type === "checkbox") {
            return (
              <label key={f.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!form[f.name]}
                  onChange={(e) => updateField(f.name, e.target.checked)}
                  style={{ width: "auto" }}
                />
                {f.label}
              </label>
            );
          }
          if (f.type === "image") {
            const imgVal = form[f.name];
            const previewSrc = imgVal
              ? imgVal.startsWith("/uploads")
                ? `${API_URL}${imgVal}`
                : imgVal
              : "";
            return (
              <label key={f.name}>
                {f.label}
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {uploading && <span> Subiendo...</span>}
                <input
                  type="text"
                  placeholder="o pega la ruta/URL de la imagen"
                  value={imgVal ?? ""}
                  onChange={(e) => updateField(f.name, e.target.value)}
                  style={{ marginTop: 8 }}
                />
                {previewSrc && (
                  <img src={previewSrc} alt="preview" className="admin-image-preview" />
                )}
              </label>
            );
          }
          if (f.type === "number") {
            return (
              <label key={f.name}>
                {f.label}
                <input
                  type="number"
                  step="0.01"
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => updateField(f.name, e.target.value)}
                />
              </label>
            );
          }
          if (f.type === "category-select") {
            const opts = categoryOptions[f.name] ?? [];
            return (
              <label key={f.name}>
                {f.label}
                <select
                  required={f.required}
                  value={form[f.name] ?? ""}
                  onChange={(e) => updateField(f.name, e.target.value)}
                >
                  <option value="">Selecciona una categoría...</option>
                  {opts.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {form[f.name] && !opts.includes(form[f.name]) && (
                    <option value={form[f.name]}>{form[f.name]} (actual)</option>
                  )}
                </select>
                <span className="hint">
                  ¿Falta una categoría? Agrégala en Administrar Productos → Categorías.
                </span>
              </label>
            );
          }
          if (f.type === "select") {
            return (
              <label key={f.name}>
                {f.label}
                <select
                  value={form[f.name] ?? f.options?.[0] ?? ""}
                  onChange={(e) => updateField(f.name, e.target.value)}
                >
                  {(f.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (f.type === "tabular") {
            const cols = f.tabularColumns ?? [];
            const value = Array.isArray(form[f.name])
              ? form[f.name]
                  .map((row: Record<string, string>) => cols.map((c) => row[c] ?? "").join(" | "))
                  .join("\n")
              : form[f.name] ?? "";
            return (
              <label key={f.name} className="full-width">
                {f.label}
                <span className="hint">
                  Un elemento por línea, separando columnas con &quot;|&quot;. Formato:{" "}
                  {cols.join(" | ")}
                </span>
                <textarea
                  style={{ minHeight: 130, fontFamily: "monospace", fontSize: 13 }}
                  placeholder={cols.map((c) => `ejemplo-${c}`).join(" | ")}
                  value={value}
                  onChange={(e) => updateField(f.name, e.target.value)}
                />
              </label>
            );
          }
          return null;
        })}

        <div className="admin-form-actions">
          <button type="submit" className="btn-admin yellow" disabled={saving || uploading}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link to={`/admin/${entityKey}`} className="btn-admin">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
