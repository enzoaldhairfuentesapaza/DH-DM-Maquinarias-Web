import type { ContentRecord, ContentField } from "../../types/content";
import { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HelpCircle, X } from "lucide-react";
import { api, resolveApiAsset } from "../../api/client";
import { entities, FieldConfig } from "./entityConfig";
import ContentPreview from "./ContentPreview";
import { normalize } from "./excelFiles";
import { useFeedback } from "../../context/FeedbackContext";
import "./admin.css";
import "./ContentPreview.css";

type FormState = ContentRecord;

const AYUDA_KEY = "hdm_ayuda_formulario_oculta";

export default function ContentForm() {
  const { entityKey, id } = useParams<{ entityKey: string; id: string }>();
  const config = entityKey ? entities[entityKey] : undefined;
  const isNew = !id || id === "nuevo";
  const navigate = useNavigate();

  const [peers, setPeers] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Record<string, string[]>>({});
  const [mostrarAyuda, setMostrarAyuda] = useState(() => localStorage.getItem(AYUDA_KEY) !== "1");
  const feedback = useFeedback();

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

  useEffect(() => {
    if (!config) return;
    let active = true;
    api.get<Record<string, unknown>[]>(`${config.apiPath}/`).then(rows => { if (active) setPeers(rows); }).catch(() => {});
    return () => { active = false; };
  }, [config]);
  const name = normalize(form.nombre ?? form.titulo);
  const repeated = name !== "" && peers.some(row => String(row.id) !== id && normalize(row.nombre ?? row.titulo) === name);

  function updateField(name: string, value: ContentField) {
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
          payload[f.name] = String(payload[f.name])
            .split("\n")
            .map((p: string) => p.trim())
            .filter(Boolean);
        }
        if (f.type === "tabular" && typeof payload[f.name] === "string") {
          const cols = f.tabularColumns ?? [];
          payload[f.name] = String(payload[f.name])
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
      feedback.success(
        isNew
          ? `Se agregó ${config.singular.toLowerCase()} correctamente.`
          : `Se guardaron los cambios de ${config.singular.toLowerCase()}.`,
      );
      navigate(`/admin/${entityKey}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!config) return <p>Sección no encontrada.</p>;
  if (loading) return <p>Cargando...</p>;


  function renderField(f: FieldConfig) {
    if (f.type === "text") {
      return (
        <label key={f.name}>
          {f.label}
          <input
            type="text"
            required={f.required}
            value={String(form[f.name] ?? "")}
            onChange={(e) => updateField(f.name, e.target.value)}
          />
          {f.hint && <span className="hint">{f.hint}</span>}
        </label>
      );
    }
    if (f.type === "textarea") {
      return (
        <label key={f.name}>
          {f.label}
          <textarea
            required={f.required}
            value={String(form[f.name] ?? "")}
            onChange={(e) => updateField(f.name, e.target.value)}
          />
          {f.hint && <span className="hint">{f.hint}</span>}
        </label>
      );
    }
    if (f.type === "paragraphs") {
      const fieldValue = form[f.name];
      const value = Array.isArray(fieldValue) ? fieldValue.join("\n") : String(fieldValue ?? "");
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
        <label
          key={f.name}
          className="admin-checkbox-field"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
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
      const previewSrc = imgVal ? resolveApiAsset(imgVal) : "";
      return (
        <label key={f.name}>
          {f.label}
          <input type="file" className="admin-image-upload" aria-label="Seleccionar imagen" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={handleImageUpload} />
          {uploading && <span> Subiendo...</span>}
          <input
            type="text"
            placeholder="o pega la ruta/URL de la imagen"
            value={String(imgVal ?? "")}
            onChange={(e) => updateField(f.name, e.target.value)}
            style={{ marginTop: 8 }}
          />
          {previewSrc && <img src={previewSrc} alt="preview" className="admin-image-preview" />}
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
            value={String(form[f.name] ?? "")}
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
            value={String(form[f.name] ?? "")}
            onChange={(e) => updateField(f.name, e.target.value)}
          >
            <option value="">Selecciona una categoría...</option>
            {opts.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            {form[f.name] && !opts.includes(String(form[f.name])) && (
              <option value={String(form[f.name])}>{String(form[f.name])} (actual)</option>
            )}
          </select>
          <span className="hint">¿Falta una categoría? Agrégala en Administrar Productos → Categorías.</span>
        </label>
      );
    }
    if (f.type === "select") {
      return (
        <label key={f.name}>
          {f.label}
          <select
            value={String(form[f.name] ?? f.options?.[0] ?? "")}
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
      const fieldValue = form[f.name];
      const rows: Record<string,string>[] = Array.isArray(fieldValue)
        ? fieldValue.filter((row): row is Record<string,string> => typeof row === "object")
        : String(fieldValue ?? "").split("\n").filter(Boolean).map(line => {const values=line.split("|");return Object.fromEntries(cols.map((col,i)=>[col,values[i]?.trim()??""]));});
      const titles: Record<string,string> = {label:"Especificación",valor:"Valor",nombre:"Producto",cantidad:"Cantidad",precio:"Precio"};
      return <fieldset key={f.name} className="tabular-editor full-width"><legend>{f.label}</legend><p className="hint">Añade una fila y completa sus campos. Puedes quitar las filas que no necesites.</p>{rows.map((row,index)=><div className="tabular-editor-row" key={index}>{cols.map(col=><label key={col}>{titles[col]??col}<input type="text" aria-label={`${titles[col]??col} ${index+1}`} value={row[col]??""} required onChange={e=>updateField(f.name,rows.map((r,i)=>i===index?{...r,[col]:e.target.value}:r))}/></label>)}<button type="button" className="btn-admin small danger" title={`Quitar fila ${index+1}`} aria-label={`Quitar fila ${index+1}`} onClick={()=>updateField(f.name,rows.filter((_,i)=>i!==index))}>−</button></div>)}<button type="button" className="btn-admin small outline" onClick={()=>updateField(f.name,[...rows,Object.fromEntries(cols.map(col=>[col,""]))])}>+ {f.name==="especificaciones"?"Añadir especificación":"Añadir producto"}</button></fieldset>;
    }
    return null;
  }

  // Si algún campo declara "section", agrupamos el formulario en bloques con
  // título; si no, se muestra igual que antes (lista simple de campos).
  const tieneSecciones = config.fields.some((f) => f.section);
  const grupos: { nombre: string | null; campos: FieldConfig[] }[] = [];
  if (tieneSecciones) {
    for (const f of config.fields) {
      const nombre = f.section ?? null;
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.nombre === nombre) {
        ultimo.campos.push(f);
      } else {
        grupos.push({ nombre, campos: [f] });
      }
    }
  } else {
    grupos.push({ nombre: null, campos: config.fields });
  }

  const formulario = (
    <form className="admin-form" onSubmit={handleSubmit}>
      {grupos.map((grupo, i) => (
        <div key={i} className={grupo.nombre ? "admin-form-section" : undefined}>
          {grupo.nombre && <h4 className="admin-form-section-title">{grupo.nombre}</h4>}
          {grupo.campos.map((f) => renderField(f))}
        </div>
      ))}

      <div className="admin-form-actions">
        <button type="submit" className="btn-admin yellow" disabled={saving || uploading}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <Link to={`/admin/${entityKey}`} className="btn-admin">
          Cancelar
        </Link>
      </div>
    </form>
  );

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1>{isNew ? `Agregar ${config.singular.toLowerCase()}` : `Editar ${config.singular.toLowerCase()}`}</h1>
          <p className="subtitle">
            {config.previewType
              ? "Completa los datos y revisa la vista previa de la derecha antes de guardar."
              : "Completa los datos y guarda cuando estés listo."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!mostrarAyuda && (
            <button
              type="button"
              className="btn-admin outline small"
              onClick={() => setMostrarAyuda(true)}
              data-tooltip="Vuelve a mostrar la guía de este formulario"
            >
              <HelpCircle size={15} /> Ayuda
            </button>
          )}
          <Link to={`/admin/${entityKey}`} className="btn-admin outline">
            Volver a la lista
          </Link>
        </div>
      </div>

      {mostrarAyuda && (
        <div className="ayuda-evaluar-box">
          <button
            type="button"
            className="ayuda-evaluar-cerrar"
            aria-label="Cerrar ayuda"
            onClick={() => {
              setMostrarAyuda(false);
              localStorage.setItem(AYUDA_KEY, "1");
            }}
          >
            <X size={15} />
          </button>
          <div className="ayuda-evaluar-titulo">
            <HelpCircle size={17} /> Cómo llenar este formulario
          </div>
          <div className="ayuda-evaluar-pasos">
            <div className="ayuda-paso">
              <span className="ayuda-paso-num">1</span>
              <div>
                <strong>Completa los datos</strong>
                <p>Los campos marcados son obligatorios; el resto es opcional.</p>
              </div>
            </div>
            <div className="ayuda-paso">
              <span className="ayuda-paso-num">2</span>
              <div>
                <strong>Revisa la vista previa</strong>
                <p>
                  {config.previewType
                    ? "A la derecha puedes ver cómo se verá en la página mientras escribes."
                    : "Este tipo de contenido no tiene una vista previa visual por ahora."}
                </p>
              </div>
            </div>
            <div className="ayuda-paso">
              <span className="ayuda-paso-num">3</span>
              <div>
                <strong>Guarda</strong>
                <p>Haz clic en "Guardar"; si algo falta, te lo señalaremos antes de enviar.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {repeated && <p role="status" className="duplicate-tag">Ya existe {config.singular.toLowerCase()} con el mismo nombre. Puedes continuar si se trata de otro registro.</p>}
      {error && <div className="admin-error">{error}</div>}

      {config.previewType ? (
        <div className="content-form-layout">
          {formulario}
          <ContentPreview type={config.previewType} form={form} />
        </div>
      ) : (
        formulario
      )}
    </div>
  );
}
