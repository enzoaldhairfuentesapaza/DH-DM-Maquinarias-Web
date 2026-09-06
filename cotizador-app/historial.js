// Adaptado para usar el backend PHP de HDM Maquinarias en vez de Supabase.

const API_URL = (() => {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8000";
  return "https://api.dh-dm-maquinarias.com";
})();

function getToken() {
  return localStorage.getItem("hdm_token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["X-Auth-Token"] = token;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = "Ocurrio un error";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

async function verificarAcceso() {
  const token = getToken();
  if (!token) {
    alert("Necesitas iniciar sesión como administrador para ver el historial.");
    window.location.href = "/admin/login";
    return false;
  }
  try {
    const usuario = await apiFetch("/api/auth/me");
    if (usuario.rol !== "admin" && usuario.rol !== "owner") {
      alert("El historial de cotizaciones es solo para administradores.");
      window.location.href = "/";
      return false;
    }
  } catch {
    alert("Tu sesión expiró. Inicia sesión de nuevo.");
    window.location.href = "/admin/login";
    return false;
  }
  return true;
}

let listaCotizacionesGlobal = [];

// =======================
// OBTENER DATA
// =======================
async function obtenerCotizaciones() {
  try {
    const data = await apiFetch("/api/cotizador");
    return data.map((c) => ({
      id: c.id,
      cliente: c.cliente_nombre,
      dni: c.cliente_documento,
      direccion: c.cliente_direccion,
      fecha: c.creado_en,
      productos: c.items,
      total: c.total,
      tipo_cambio: c.tipo_cambio,
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

// =======================
// CARGAR LISTA
// =======================
async function cargarLista() {

  const tbody = document.getElementById("tablaCotizaciones");
  tbody.innerHTML = "<tr><td colspan='9'>Cargando...</td></tr>";

  const lista = await obtenerCotizaciones();

  listaCotizacionesGlobal = lista;

  aplicarFiltros();
}

// =======================
// RENDER TABLA
// =======================
function renderTabla(lista) {

  const tbody = document.getElementById("tablaCotizaciones");

  if (!lista.length) {
    tbody.innerHTML = "<tr><td colspan='9'>Sin resultados</td></tr>";
    return;
  }

  let html = "";

  lista.forEach(c => {
    html += `
      <tr>
        <td>${c.id}</td>
        <td>${c.cliente}</td>
        <td>${new Date(c.fecha).toLocaleDateString()}</td>
        <td>${c.dni || "-"}</td>
        <td>${c.direccion || "-"}</td>
        <td>${c.total}</td>
        <td>${c.tipo_cambio || "-"}</td>
        <td>${c.cantidad_productos || 0}</td>
        <td class="acciones">
          <button onclick='abrirCotizacion(${c.id})'>✏️</button>
          <button onclick='descargarPDF(${c.id})'>⬇️</button>
          <button onclick='borrarCotizacion(${c.id})'>🗑️</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// =======================
// FILTROS (TEXTO + FECHA + ORDEN)
// =======================
function aplicarFiltros() {

  const texto = buscador.value.toLowerCase().trim();
  const fechaSeleccionada = filtroFecha.value;
  const orden = ordenId.value;

  let filtrado = listaCotizacionesGlobal.filter(c => {

    const coincideTexto =
      String(c.id).includes(texto) ||
      (c.cliente || "").toLowerCase().trim().includes(texto) ||
      (c.dni || "").toLowerCase().trim().includes(texto) ||
      (c.direccion || "").toLowerCase().trim().includes(texto);

    let coincideFecha = true;

    if (fechaSeleccionada) {
      const fecha = new Date(c.fecha);

      const fechaCoti =
        fecha.getFullYear() + "-" +
        String(fecha.getMonth() + 1).padStart(2, "0") + "-" +
        String(fecha.getDate()).padStart(2, "0");
      coincideFecha = fechaCoti === fechaSeleccionada;
    }

    console.log("Filtro fecha:", fechaSeleccionada);

    const fecha = new Date(c.fecha);

    const fechaCoti =
      fecha.getFullYear() + "-" +
      String(fecha.getMonth() + 1).padStart(2, "0") + "-" +
      String(fecha.getDate()).padStart(2, "0");

    console.log("Fecha BD:", fechaCoti)

    return coincideTexto && coincideFecha;
  });

  // 🔥 ORDENAR
  filtrado.sort((a, b) => {
    return orden === "asc" ? a.id - b.id : b.id - a.id;
  });

  renderTabla(filtrado);
}

// =======================
// BORRAR
// =======================
async function borrarCotizacion(id) {

  const confirmar = confirm("¿Seguro que deseas borrar esta cotización?");
  if (!confirmar) return;

  try {
    await apiFetch(`/api/cotizador/${id}`, { method: "DELETE" });
    alert("Cotización eliminada ✅");
    cargarLista();
  } catch (err) {
    console.error(err);
    alert("Error al borrar la cotización: " + err.message);
  }
}

// =======================
// PDF
// =======================
async function descargarPDF(id) 
{
  let cotizacion;
  try {
    const c = await apiFetch(`/api/cotizador/${id}`);
    cotizacion = {
      id: c.id,
      cliente: c.cliente_nombre,
      dni: c.cliente_documento,
      direccion: c.cliente_direccion,
      fecha: c.creado_en,
      productos: c.items,
      total: c.total,
      tipo_cambio: c.tipo_cambio,
    };
  } catch (err) {
    alert("No se pudo cargar la cotización");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const img = new Image();
  img.src = "plantillahdm.png";
  await new Promise(r => img.onload = r);

  doc.addImage(img, "PNG", 0, 0, 210, 297);

  doc.setFontSize(9);

  doc.text(cotizacion.dni || "-", 48, 62);
  doc.text(cotizacion.cliente || "-", 48, 68);
  doc.text(cotizacion.direccion || "-", 48, 74);
  doc.text(new Date(cotizacion.fecha).toLocaleDateString(), 48, 80);

  doc.setFontSize(24);
  doc.text(String(cotizacion.id).padStart(7, "0"), 161, 45);

  doc.setFontSize(7);

  let y = 107;
  let total = 0;
  let index = 1;

  (cotizacion.productos || []).forEach(p => {

    // 🔥 cálculo igual al index
    let precio = p.price;

    if (p.currency === "USD") {
      precio *= (cotizacion.tipo_cambio || 1);
    }

    (p.brandAdjustments || []).forEach(a => precio *= (1 + a / 100));
    (p.discounts || []).forEach(d => precio *= (1 - d / 100));

    const precioFinal = Math.round(precio);
    const subtotal = precioFinal * p.qty;
    total += subtotal;

    const descTexto =
      p.showDiscounts && p.discounts?.length
        ? `${p.desc} (Desc: ${p.discounts.join("%, ")}%)`
        : p.desc;

    // 🔥 multilínea (igual que index)
    const codigoLines = doc.splitTextToSize(p.code, 20);
    const descLines = doc.splitTextToSize(descTexto, 58);

    const lineHeight = 5;
    const maxLines = Math.max(codigoLines.length, descLines.length);
    const blockHeight = maxLines * lineHeight;

    // 🔹 todo alineado arriba (como decidiste)
    doc.setFontSize(10);
    doc.text(String(index), 9, y);

    doc.setFontSize(7);

    doc.text(codigoLines, 18, y);
    doc.text(p.unit, 41, y);
    doc.text(p.qty.toString(), 66, y);
    doc.text(p.brand, 85, y);

    doc.text(descLines, 103, y - 1);

    doc.text(precioFinal.toFixed(2), 180, y, { align: "right" });
    doc.text(subtotal.toFixed(2), 202, y, { align: "right" });

    y += blockHeight;
    index++;
  });

  doc.setFontSize(10);
  doc.text(total.toFixed(2), 202, 275, { align: "right" });

  doc.save(`Cotizacion_${cotizacion.id}.pdf`);
}
// =======================
// NAVEGACIÓN
// =======================
window.abrirCotizacion = function(numero) {
  localStorage.setItem("cotizacionAbrir", numero);
  window.location.href = "index.html";
};

window.borrarCotizacion = borrarCotizacion;
window.descargarPDF = descargarPDF;

// =======================
// EVENTOS
// =======================
const buscador = document.getElementById("buscadorCotizaciones");
const filtroFecha = document.getElementById("filtroFecha");
const ordenId = document.getElementById("ordenId");

buscador.addEventListener("input", aplicarFiltros);
filtroFecha.addEventListener("change", aplicarFiltros);
ordenId.addEventListener("change", aplicarFiltros);

// =======================
(async () => {
  const ok = await verificarAcceso();
  if (ok) cargarLista();
})();