//script.js
// ---------------------------------------------------------------------
// Adaptado para usar el backend PHP de HDM Maquinarias en vez de Supabase,
// y el catalogo real de la base de datos en vez de una lista propia.
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// Control de acceso: solo admin/owner logueados pueden usar el cotizador.
// Se comparte el mismo token (localStorage "hdm_token") que usa el sitio
// principal en React, asi que si ya iniciaste sesion ahi, aqui tambien
// quedas identificado automaticamente.
// ---------------------------------------------------------------------
let usuarioActual = null;

async function verificarAcceso() {
  const token = getToken();
  if (!token) {
    alert("Necesitas iniciar sesión como administrador para usar el cotizador.");
    window.location.href = "/admin/login";
    return false;
  }
  try {
    usuarioActual = await apiFetch("/api/auth/me");
  } catch {
    alert("Tu sesión expiró. Inicia sesión de nuevo.");
    window.location.href = "/admin/login";
    return false;
  }
  if (usuarioActual.rol !== "admin" && usuarioActual.rol !== "owner") {
    alert("El cotizador es solo para administradores.");
    window.location.href = "/";
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// Catalogo de productos: se carga desde la base de datos real
// (maquinaria + repuestos) en vez de productos.js
// ---------------------------------------------------------------------
let productos = [];

async function cargarCatalogo() {
  try {
    const [maquinarias, repuestos] = await Promise.all([
      apiFetch("/api/maquinaria"),
      apiFetch("/api/repuestos"),
    ]);
    const deMaquinaria = maquinarias.map((m) => ({
      id: `MAQ-${m.id}`,
      nombre: m.nombre,
      unidad: "UNIDADES",
      marca: m.marca,
    }));
    const deRepuestos = repuestos.map((r) => ({
      id: r.codigo,
      nombre: r.nombre,
      unidad: r.unidad || "UNIDADES",
      marca: r.marca,
    }));
    productos = [...deMaquinaria, ...deRepuestos];
  } catch (err) {
    console.error("No se pudo cargar el catálogo:", err);
    productos = [];
  }
}

const tituloCotizacion = document.getElementById("tituloCotizacion");
tituloCotizacion.innerText = "Cotización Nueva";

const input = document.getElementById("codigoProducto");
const sugerencias = document.getElementById("sugerencias");


let editIndex = null;
let numeroCotizacionActual = 1;

const marca = document.getElementById("marca");
let lastBrand = marca.value;


document.addEventListener("click", (e) => {
  if (!input.contains(e.target) && !sugerencias.contains(e.target)) {
    sugerencias.innerHTML = "";
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    sugerencias.innerHTML = "";
  }
});

input.addEventListener("input", () => {
  const valor = input.value.toLowerCase();
  sugerencias.innerHTML = "";

  if (!valor) 
  {
    sugerencias.innerHTML = "";
    return;
  }

  const resultados = productos.filter(p =>
    p.id.toLowerCase().includes(valor) ||
    p.nombre.toLowerCase().includes(valor)
  );

  resultados.slice(0, 5).forEach(p => {
    const div = document.createElement("div");

    div.textContent = `${p.id} - ${p.nombre}`;
    div.style.padding = "6px";
    div.style.cursor = "pointer";

    div.addEventListener("click", () => seleccionarProducto(p));

    sugerencias.appendChild(div);
  });
});


function seleccionarProducto(p) {
  document.getElementById("codigoProducto").value = p.id;
  document.getElementById("descripcion").value = p.nombre;
  document.getElementById("unidad").value = p.unidad;

  // 🔥 Marca automática (adaptado a tu select)
  const selectMarca = document.getElementById("marca");

  if ([...selectMarca.options].some(o => o.value === p.marca)) {
    selectMarca.value = p.marca;
  } else {
    selectMarca.value = "Otro";
    document.getElementById("otraMarca").style.display = "block";
    document.getElementById("otraMarca").value = p.marca;
  }
  renderBrandAdjustments();
  sugerencias.innerHTML = "";
}

async function inicializarNumeroCotizacion() {
  numeroCotizacionActual = await obtenerSiguienteNumero();
  updatePDFPreview(numeroCotizacionActual);
}

async function iniciar() {
  const ok = await verificarAcceso();
  if (!ok) return;
  await cargarCatalogo();
  await inicializarNumeroCotizacion();
}
iniciar();

function updateBrandInputsTemp() {
  brandInputsTemp = [...document.querySelectorAll(".brand-input")]
    .map(i => Number(i.value))
    .filter(v => v > 0);
}


function renderBrandAdjustments() {
  const box = document.getElementById("brandAdjustmentsBox");
  box.innerHTML = "";

  const brand = marca.value;

  // ================= CAT =================
  if (brand === "CAT") {
    box.innerHTML = `
      <label class="brand-adjustment">
        <input type="checkbox" checked data-value="18">
        <span>+18%</span>
      </label>
    `;
    return;
  }

  // ================= CTP / Handok / IPD =================
  if (["CTP", "Handok", "IPD"].includes(brand)) {
    box.innerHTML = `
      <div class="discount-input-group">
        <input type="number" class="brand-input" placeholder="+ %" value="${brandInputsTemp[0] || ""}" oninput="updateBrandInputsTemp()" />
        <input type="number" class="brand-input" placeholder="+ %" value="${brandInputsTemp[1] || ""}" oninput="updateBrandInputsTemp()" />
      </div>
    `;
    return;
  }

  // ================= OTRO =================
  if (brand === "Otro") {

    // checkboxes existentes
    brandAdjustmentsTemp.forEach(value => {
      box.innerHTML += `
        <label class="brand-adjustment">
          <input type="checkbox" checked data-value="${value}">
          <span>+${value}%</span>
        </label>
      `;
    });

    // formulario dinámico
    box.innerHTML += `
      <div class="discount-action">
        <div class="discount-input-group">
          <input type="number" id="brandAdjInput" placeholder="%" />

          <div class="discount-mini-buttons">
            <button type="button" onclick="addBrandAdjustment()">+</button>
            <button type="button" onclick="removeBrandAdjustment()">−</button>
          </div>
        </div>
      </div>
    `;
  }
}


function addBrandAdjustment() {
  const input = document.getElementById("brandAdjInput");
  const value = Number(input.value);

  if (value > 0) {
    brandAdjustmentsTemp.push(value);
    input.value = "";
    renderBrandAdjustments();
  }
}

function removeBrandAdjustment() {
  brandAdjustmentsTemp.pop();
  renderBrandAdjustments();
}

function saveCurrentBrandMemory() {

  if (!lastBrand) return;

  const inputs = [...document.querySelectorAll(".brand-input")];

  if (inputs.length) {
    brandMemory[lastBrand] = inputs
      .map(i => Number(i.value))
      .filter(v => v > 0);
  }
}


function toggleOtraMarca() {
  otraMarca.style.display = marca.value === "Otro" ? "block" : "none";

  if (marca.value === "Otro") {
    brandAdjustmentsTemp = [];
  }
  renderBrandAdjustments();
}

let products = [];
let discountsTemp = [];
let brandAdjustmentsTemp = [];
let brandInputsTemp = [];

let brandMemory = {};
//abreviaturas
const abreviaturasUnidad = {
  "UNIDADES": "UND",
  "CAJA":"CAJA",
  "CILINDRO":"CLN",
  "JUEGO":"JGO",
  "KIT(EQUIPO)":"KT(E)",
  "BALDE":"BLD",
  "PAQUETE":"PQT",

}
function abreviarUnidad(unidad){
  unidad = (unidad || "UND").trim().toUpperCase();
  return abreviaturasUnidad[unidad] || unidad;
}
/* =======================
   TIPO DE CAMBIO
======================= */
function convertAll(target) {
  products.forEach(p => {
    if (p.currency !== target) {
      toggleCurrencyByValue(p, target);
    }
  });
  renderTable();
}
async function savePDF() {
  const fecha = getFechaEmision();

  const clienteNombre = cliente.value || "Sin nombre";
  const total = document.getElementById("total").innerText || "0.00";

  const doc = await buildPDF(ficha);
  doc.save(`ARCHIVOS_${ficha}.pdf`);

  const historial = JSON.parse(localStorage.getItem("historial")) || [];

  historial.push({ ficha, fecha, cliente: clienteNombre, total });

  localStorage.setItem("historial", JSON.stringify(historial));
}

tc.value = "";

async function cargarListaCotizaciones() {

  const lista = await obtenerCotizaciones();

  const tbody = document.getElementById("tablaCotizaciones");
  tbody.innerHTML = "";

  lista.forEach(c => {

    tbody.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.cliente}</td>
        <td>${new Date(c.fecha).toLocaleDateString()}</td>
        <td>${c.total}</td>
        <td>
          <button onclick='cargarCotizacionDesdeDB(${JSON.stringify(c)})'>
            Abrir
          </button>
        </td>
      </tr>
    `;
  });
}

function cargarCotizacionDesdeDB(coti) {

  cliente.value = coti.cliente;
  products = coti.productos;

  renderTable();
}



/*async function loadTipoCambio() {
  try {
    const res = await fetch("https://api.apis.net.pe/v1/tipo-cambio-sunat");
    const data = await res.json();
    tc.value = data.venta;
  } catch {
    tc.value = 3.75;
  }
}
loadTipoCambio();
*/
/* =======================
   UI
======================= */

function updateMonedaLabel() {
  const label = document.getElementById("monedaLabel");
  const select = document.getElementById("monedaProducto");

  label.innerText = select.value;
}
updateMonedaLabel();


/* =======================
   DESCUENTOS
======================= */
function addDiscount() {
  const d = Number(descuentoInput.value);
  if (d > 0) {
    discountsTemp.push(d);
    descuentoInput.value = "";
    updateDiscountLabel();
  }
}

function removeDiscount() {
  discountsTemp.pop();
  updateDiscountLabel();
}

function updateDiscountLabel() {
  listaDescuentos.innerText =
    discountsTemp.length ? discountsTemp.join("%, ") + "%" : "Ningun descuento añadido";
}

/* =======================
   PRODUCTOS
======================= */
function addProduct() {

  if (monedaProducto.value === "USD") {
    const tipoCambio = Number(tc.value);

    if (!tipoCambio || tipoCambio <= 0) {
      alert("Debes ingresar un tipo de cambio válido antes de agregar un producto en USD.");
      tc.focus();
      return;
    }
  }

  let adjustments = [];

  if (marca.value === "CAT" || marca.value === "Otro") {

    adjustments = [...document.querySelectorAll(
      "#brandAdjustmentsBox input:checked"
    )].map(i => Number(i.dataset.value));

  } else if (["CTP", "Handok", "IPD"].includes(marca.value)) {

      adjustments = [...document.querySelectorAll(".brand-input")]
        .map(i => Number(i.value))
        .filter(v => v > 0);
  }

  const brandFinal =
    marca.value === "Otro"
      ? (otraMarca.value || "Otro")
      : marca.value;

  const product = {
    code: codigoProducto.value,
    brand: brandFinal,
    unit: abreviarUnidad (unidad.value),
    qty: Number(cantidad.value),
    desc: descripcion.value,
    price: Number(precio.value),
    currency: monedaProducto.value,
    discounts: [...discountsTemp],
    brandAdjustments: adjustments,
    showDiscounts: mostrarDescCheck.checked 
  };

  if (editIndex !== null) {
    products[editIndex] = product;
    editIndex = null;
  } else {
    products.push(product);
  }
  document.getElementById("btnAgregar").innerText = "Agregar Producto";
  document.getElementById("tituloProducto").innerText = "Nuevo Producto";
  saveCurrentBrandMemory();
  clearForm();
  renderTable();

}

function toggleCurrency(index) {
  const p = products[index];
  p.currency = p.currency === "USD" ? "PEN" : "USD";
  renderTable();
}

function clearProducts() {
  products = [];
  renderTable();
}

function clearForm() {
  codigoProducto.value = "";
  cantidad.value = 1;
  descripcion.value = "";
  precio.value = "";

  // 👇 restaurar memoria de marca
  const brandActual =
    marca.value === "Otro" ? otraMarca.value : marca.value;

  brandInputsTemp = [...(brandMemory[brandActual] || [])];

  renderBrandAdjustments();

  monedaProducto.value = "USD";
  updateMonedaLabel();
}


/* =======================
   CÁLCULO
======================= */
function calcularPrecioFinal(p) {

  let precio = p.price;
  if (p.brandAdjustments?.length) {
    precio = p.brandAdjustments.reduce(
      (acc, a) => acc * (1 + a / 100),
      precio
    );
  }
  if (p.discounts?.length) {
    precio = p.discounts.reduce(
      (acc, d) => acc * (1 - d / 100),
      precio
    );
  }
  if (p.currency === "USD") {
    const tcambio = Number(tc.value);

    if (tcambio && tcambio > 0) {
      precio *= tcambio;
    }
  }

  return Math.round(precio);
}


/* =======================
   TABLA
======================= */
function setAllCurrency(currency) {
  products.forEach(p => p.currency = currency);
  renderTable();
}
function renderTable() {
  const tbody = document.getElementById("tabla");
  tbody.innerHTML = "";

  let total = 0;

  products.forEach((p, i) => {
    const subtotal = calcularPrecioFinal(p) * p.qty;
    total += subtotal;

    const descTexto = p.discounts.length
      ? `${p.desc} (Desc: ${p.discounts.join("%, ")}%)`
      : p.desc;

    tbody.innerHTML += `
      <tr>
        <td>${p.code}</td>
        <td>${p.unit}</td>
        <td>${p.brand}</td>
        <td>${p.qty}</td>
        <td>${descTexto}</td>
        <td>${p.price.toFixed(2)} ${p.currency}</td>
        <td>${subtotal.toFixed(2)}</td>
        <td>
          <div class="actions-wrap">
            <button title="Editar producto" onclick="editProduct(${i})">✏️</button>

            <button title="Cambiar moneda (USD / PEN)" onclick="toggleCurrency(${i})">
              ${p.currency === "USD" ? "💲" : "🪙"}
            </button>

            <button title="Eliminar producto" onclick="eliminarProducto(${i})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });

  document.getElementById("total").innerText = total.toFixed(2);
  updatePDFPreview(numeroCotizacionActual);
}


function editProduct(index) 
{
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
  document.getElementById("tituloProducto").innerText = `Editando Producto ${index + 1}`;
  const p = products[index];
  editIndex = index;

  codigoProducto.value = p.code;
  marca.value = p.brand;
  unidad.value = p.unit;
  cantidad.value = p.qty;
  descripcion.value = p.desc;
  precio.value = p.price;
  monedaProducto.value = p.currency;
  updateMonedaLabel();
  mostrarDescCheck.checked = p.showDiscounts ?? true;

  discountsTemp = [...p.discounts];
  toggleOtraMarca();
  
  brandInputsTemp = [...(p.brandAdjustments || [])];

  document.getElementById("btnAgregar").innerText = "Actualizar Producto";

  renderBrandAdjustments();
  
  updateDiscountLabel();

  updateMonedaLabel();
}

/* =======================
   PDF
======================= */


async function buildPDF(numeroCotizacion, data = null)
{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const img = new Image();
  img.src = "plantillahdm.png";
  await new Promise(resolve => img.onload = resolve);

  doc.addImage(img, "PNG", 0, 0, 210, 297);

  doc.setFontSize(9);

  doc.text(dni.value || "-", 40, 59.6);
  doc.text(cliente.value || "-", 40, 66.3);
  doc.text(direccion.value || "-", 40, 73);
  doc.text(getFechaEmision(), 40, 80);

  const numeroFormateado =
    String(numeroCotizacion).padStart(7, "0");

  doc.setFontSize(19);
  doc.text(numeroFormateado, 170, 28);

  doc.setFontSize(7);

  let y = 100;
  let total = 0;
  let index = 1;

  products.forEach(p => {
    const precioFinal = calcularPrecioFinal(p);
    const subtotal = precioFinal * p.qty;
    total += subtotal;

    const descTexto =
      p.showDiscounts && p.discounts.length
        ? `${p.desc} (Desc: ${p.discounts.join("%, ")}%)`
        : p.desc;

    const codigoLines = doc.splitTextToSize(p.code, 20);
    const descLines = doc.splitTextToSize(descTexto, 58);

    const lineHeight = 5;
    const maxLines = Math.max(codigoLines.length, descLines.length);
    const blockHeight = maxLines * lineHeight;

    // 🔹 TODO parte desde la misma línea base (y)

    doc.setFontSize(10);
    doc.text(String(index), 5.7, y);

    doc.setFontSize(10);
    //codigo
    doc.text(codigoLines, 14, y);
    //unidad
    doc.text(p.unit, 137, y);
    //cantidad - 
    doc.text(p.qty.toString(), 153, y);
    //marca
    doc.text(p.brand, 44, y);
    // decripcion
    doc.text(descLines, 60, y - 1);

    // precios alineados con la primera línea
    //PRECIO UNITARIO
    doc.text(precioFinal.toFixed(2), 184.4, y, { align: "right" });
    //PRECIO FINAL
    doc.text(subtotal.toFixed(2), 208, y, { align: "right" });

    // 🔥 crecimiento SOLO hacia abajo
    y += blockHeight;

    index++;
  });
  //TOTAL
  doc.setFontSize(11);
  doc.text(total.toFixed(2), 207, 282, { align: "right" });

  return doc;
}

async function obtenerSiguienteNumero() {
  try {
    const lista = await apiFetch("/api/cotizador");
    if (!lista.length) return 1;
    const maxId = Math.max(...lista.map((c) => c.id));
    return maxId + 1;
  } catch (err) {
    console.error(err);
    return 1;
  }
}

async function guardarCotizacion() {

  if (!products.length) {
    alert("Agrega al menos un producto");
    return;
  }
  

  const clienteNombre = cliente.value || "Sin nombre";
  const clienteDni = dni.value || "";
  const clienteDireccion = direccion.value || "";

  const total = Number(document.getElementById("total").innerText);

  // 🧠 NUEVO: tipo de cambio
  const tipoCambio = Number(tc.value) || 0;

  try {
    const data = await apiFetch("/api/cotizador", {
      method: "POST",
      body: JSON.stringify({
        numero: `TEMP-${Date.now()}`,
        cliente_nombre: clienteNombre,
        cliente_documento: clienteDni,
        cliente_direccion: clienteDireccion,
        items: products,
        tipo_cambio: tipoCambio,
        moneda_mostrar: "PEN",
        total: total,
      }),
    });

    const idGenerado = data.id;

    alert(`Cotización guardada correctamente N° ${idGenerado}`);
    updatePDFPreview(idGenerado);
  } catch (err) {
    console.error(err);
    alert("Error guardando cotización: " + err.message);
  }
}

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

function cargarCotizacion(coti) {

  cliente.value = coti.cliente || "";
  dni.value = coti.dni || "";
  direccion.value = coti.direccion || "";

  products = coti.productos || [];

  renderTable();
}


async function updatePDFPreview(id = numeroCotizacionActual) {
  const doc = await buildPDF(id);
  pdfPreview.src = URL.createObjectURL(doc.output("blob"));
}

async function downloadPDF(id = numeroCotizacionActual) {
  const doc = await buildPDF(id);
  doc.save(`Cotizacion_${id}.pdf`);
}

function getFechaEmision() {
  const f = new Date();
  return f.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

renderBrandAdjustments();
updatePDFPreview(0);

marca.addEventListener("change", () => {

  // Guardar valores de la marca anterior
  saveCurrentBrandMemory();

  toggleOtraMarca();

  const brandActual =
    marca.value === "Otro" ? otraMarca.value : marca.value;

  // Recuperar memoria de la nueva marca
  brandInputsTemp = [...(brandMemory[brandActual] || [])];

  renderBrandAdjustments();

  // Actualizar marca previa
  lastBrand = brandActual;
});

async function cargarCotizacionDesdeNumero() 
{
  const id = localStorage.getItem("cotizacionAbrir");
  if (!id) return;

  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error cargando:", error);
    return;
  }

  tituloCotizacion.innerText = `Editando Cotización N° ${data.id}`;

  cliente.value = data.cliente || "";
  dni.value = data.dni || "";
  direccion.value = data.direccion || "";

  const tcInput = document.getElementById("tc");
  tcInput.value = data.tipo_cambio ? Number(data.tipo_cambio) : "";

  products = data.productos || [];
  updateMonedaLabel();

  renderTable();

  localStorage.removeItem("cotizacionAbrir");
  const aviso = document.getElementById("modoEdicionAviso");
  aviso.style.display = "block";
}
cargarCotizacionDesdeNumero();



function eliminarProducto(index){
  products.splice(index,1);
  renderTable();
}

window.eliminarProducto = eliminarProducto;
window.addProduct = addProduct;
window.guardarCotizacion = guardarCotizacion;
window.downloadPDF = downloadPDF;
window.clearProducts = clearProducts;
window.addDiscount = addDiscount;
window.removeDiscount = removeDiscount;
window.toggleOtraMarca = toggleOtraMarca;
window.updatePDFPreview = updatePDFPreview;
window.toggleCurrency = toggleCurrency;
window.editProduct = editProduct;
window.renderTable = renderTable;