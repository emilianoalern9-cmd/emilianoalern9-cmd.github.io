/* ═══════════════════════════════════════════════════════════
   ui.js — Referencias DOM, badges, tooltip, búsqueda, imágenes
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Referencias DOM ─────────────────────────────────────── */
const $ = id => document.getElementById(id);

const btnMorfologia     = $('btnMorfologia');
const btnTipo           = $('btnTipo');
const btnElemento       = $('btnElemento');
const btnAvistamiento   = $('btnAvistamiento');
const btnUbicacion      = $('btnUbicacion');
const btnEpoca          = $('btnEpoca');
const btnSubcategorias  = $('btnSubcategorias');
const btnRevFilter      = $('btnRevFilter');
const btnLimpiar        = $('btnLimpiar');
const btnOrden          = $('btnOrden');
const favFilterBtn      = $('favFilterBtn');
const configBtn         = $('configBtn');
const btnResetTotal     = $('btnResetTotal');
const ordenMenu         = $('ordenMenu');
const configMenu        = $('configMenu');
const revFilterMenu     = $('menu-rev');
const overlayEl         = $('overlay');
const mainTitle         = $('mainTitle');
const headerCornerImg   = $('headerCornerImg');
const mainHeader        = $('mainHeader');
const gridDiv           = $('grid');
const resultSpan        = $('resultText');
const searchInput       = $('searchInput');
const clearSearchBtn    = $('clearSearch');
const searchDatalist    = $('searchSuggestions');
const paginationControlsDiv = $('paginationControls');
const modalPrevArrow    = $('modalPrevArrow');
const modalNextArrow    = $('modalNextArrow');
const modalTitle        = $('modal-title');
const modalImg          = $('modal-image');
const modalInfoScroll   = $('modal-info-scroll');
const modalRevisadoBtn  = $('modalRevisado');
const modalFavBtn       = $('modalFav');
const cerrarBtn         = $('cerrar');

const HEADER_Z = '100';

/* ── Inicialización de botones de categorías ────────────── */
(function configurarBotonesCategorias() {
  for (const [cat, cfg] of Object.entries(CATEGORIAS)) {
    const btn = { morfologia: btnMorfologia, tipo: btnTipo, elemento: btnElemento, avistamiento: btnAvistamiento }[cat];
    if (btn) { btn.textContent = cfg.btn; btn.title = cfg.titulo; }
  }
})();

/* ── Tooltip ─────────────────────────────────────────────── */
let tooltipEl = null, tooltipTimeout = null;

function showTooltip(text, x, y, duration = 1500) {
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "temp-tooltip";
    tooltipEl.style.opacity = "0";
    document.body.appendChild(tooltipEl);
  }
  if (tooltipTimeout) clearTimeout(tooltipTimeout);
  tooltipEl.textContent = text;
  tooltipEl.style.left  = x + "px";
  tooltipEl.style.top   = y + "px";
  tooltipEl.style.opacity = "1";

  requestAnimationFrame(() => {
    const r  = tooltipEl.getBoundingClientRect();
    const fx = Math.max(10, Math.min(x, window.innerWidth  - r.width  - 10));
    const fy = Math.max(10, Math.min(y, window.innerHeight - r.height - 10));
    tooltipEl.style.left = fx + "px";
    tooltipEl.style.top  = fy + "px";
  });

  tooltipTimeout = setTimeout(() => {
    tooltipEl.style.opacity = "0";
    tooltipTimeout = null;
  }, duration);
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.opacity = "0";
  if (tooltipTimeout) { clearTimeout(tooltipTimeout); tooltipTimeout = null; }
}

document.addEventListener("click", () => hideTooltip());

function setupBadgeHover(badge, text) {
  badge.addEventListener("mouseenter", () => {
    const r = badge.getBoundingClientRect();
    showTooltip(text, r.left + r.width / 2, r.top - 10, 2000);
  });
  badge.addEventListener("mouseleave", () => hideTooltip());
}

/* ── Imagen con fallback y sistema de foco ──────────────── */
const IMG_EXTS = ['jpg', 'jpeg', 'png'];

function setImageWithFallback(imgEl, nombre, foco, isPriority = false, isModal = false) {
  if (isPriority) {
    imgEl.fetchPriority = "high";
    imgEl.loading = "eager";
  } else {
    imgEl.loading = "lazy";
  }

  if (!isModal) {
    imgEl.style.objectFit      = "cover";
    imgEl.style.objectPosition = focoToObjectPosition(foco);
    imgEl.style.transform      = "";
  }

  const parent = imgEl.parentNode;
  parent?.querySelectorAll('.img-placeholder').forEach(el => el.remove());

  let idx = 0;
  const tryNext = () => {
    if (idx >= IMG_EXTS.length) {
      imgEl.style.display = "none";
      if (!parent?.querySelector(".img-placeholder")) {
        const ph = document.createElement("div");
        ph.className = "img-placeholder";
        ph.textContent = "🖼️";
        ph.setAttribute("aria-label", "Imagen no disponible");
        parent?.appendChild(ph);
      }
      return;
    }
    imgEl.src = `img/${encodeURIComponent(nombre)}.${IMG_EXTS[idx]}`;
    imgEl.style.display = "block";
    imgEl.onerror = () => { idx++; tryNext(); };
    imgEl.onload  = () => { parent?.querySelector(".img-placeholder")?.remove(); imgEl.style.display = "block"; };
  };
  tryNext();
}

function crearImg(e, isPriority = false) {
  const img = document.createElement("img");
  img.alt = e.nombre;
  setImageWithFallback(img, e.nombre, e.foco, isPriority, false);
  return img;
}

/* ── Favoritos — estado visual ───────────────────────────── */
function actualizarEstadoFavoritosYBoton() {
  favFilterBtn.disabled = favoritos.size === 0;
  if (favoritos.size === 0 && onlyFavorites) { onlyFavorites = false; render(); }
}

/* ── Badges de tarjeta ───────────────────────────────────── */
function crearBadge(ico, titulo) {
  const btn = document.createElement("button");
  btn.className = "mini-badge";
  btn.textContent = ico;
  btn.setAttribute('aria-label', titulo);
  setupBadgeHover(btn, titulo);
  btn.addEventListener("click", e => e.stopPropagation());
  return btn;
}

function crearBadgesRow(e) {
  return [
    crearBadge(getIcon('morfologia',   e.morfologia),   `Morfología: ${e.morfologia}`),
    crearBadge(getIcon('tipo',         e.tipo),         `Tipo: ${e.tipo}`),
    crearBadge(getIcon('elemento',     e.elemento),     `Elemento: ${e.elemento}`),
    crearBadge(getIcon('avistamiento', e.avistamiento), `Avistamiento: ${e.avistamiento}`)
  ];
}

/* ── Badges de filtros activos ───────────────────────────── */
function updateFilterBadges() {
  const { morfologia:mc, tipo:tc, elemento:ec, avistamiento:ac, ubicacion:uc, epoca:epc, subcategorias:sc }
    = Object.fromEntries(Object.entries(filtrosState).map(([k, v]) => [k, v.length]));

  btnMorfologia.title    = `Morfología${mc  ? ` (${mc})`  : ''}`;   actualizarFiltroActivo(btnMorfologia,    mc  > 0);
  btnTipo.title          = `Tipo${tc        ? ` (${tc})`  : ''}`;   actualizarFiltroActivo(btnTipo,          tc  > 0);
  btnElemento.title      = `Elemento${ec    ? ` (${ec})`  : ''}`;   actualizarFiltroActivo(btnElemento,      ec  > 0);
  btnAvistamiento.title  = `Avistamiento${ac? ` (${ac})`  : ''}`;   actualizarFiltroActivo(btnAvistamiento,  ac  > 0);
  btnUbicacion.title     = `Ubicación${uc   ? ` (${uc})`  : ''}`;   actualizarFiltroActivo(btnUbicacion,     uc  > 0);
  btnEpoca.title         = `Época${epc      ? ` (${epc})` : ''}`;   actualizarFiltroActivo(btnEpoca,         epc > 0);
  btnSubcategorias.title = `Subcategorías${sc? ` (${sc})` : ''}`;   actualizarFiltroActivo(btnSubcategorias, sc  > 0);
  favFilterBtn.classList.toggle('active', onlyFavorites);
  updateRevFilterBadge();
  actualizarBotonLimpiar();
}

const actualizarFiltroActivo = (btn, activo) => btn.classList.toggle('active-filter', activo);

function actualizarBotonLimpiar() {
  btnLimpiar.disabled =
    currentOrderedList.length === 0 ||
    (!Object.values(filtrosState).some(a => a.length) && !revFilterState.length);
}

function updateRevFilterBadge() {
  const n = revFilterState.length;
  btnRevFilter.title = n === 0
    ? "Filtrar por revisado"
    : n === 1
      ? `Filtrar: ${revFilterState[0] === "revisado" ? "Revisado" : "No revisado"}`
      : "Filtrar: revisado y no revisado";
  actualizarFiltroActivo(btnRevFilter, n > 0);
}

/* ── Orden ───────────────────────────────────────────────── */
function actualizarTooltipOrden() {
  const mapa = Object.fromEntries(ORDEN_OPCIONES.map(o => [o.v, o.l]));
  btnOrden.title = mapa[ordenActual] || "Ordenar";
}

/* ── Disabled de filtros ─────────────────────────────────── */
function actualizarDisabledOtrosFiltros() {
  const cats = [
    [btnMorfologia,'morfologia'], [btnTipo,'tipo'], [btnElemento,'elemento'],
    [btnAvistamiento,'avistamiento'], [btnUbicacion,'ubicacion'],
    [btnEpoca,'epoca'], [btnSubcategorias,'subcategorias']
  ];
  cats.forEach(([btn, cat]) => {
    if (btn) btn.disabled = getCachedOpcionesConDatos(cat) <= 1;
  });
}

function actualizarEstadoBotonRevisado() {
  invalidateBaseCache();
  btnRevFilter.disabled =
    (contarPorEstado("revisado")    > 0 ? 1 : 0) +
    (contarPorEstado("no_revisado") > 0 ? 1 : 0) <= 1;
}

/* ── Búsqueda ────────────────────────────────────────────── */
function levenshteinDistance(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let j = 1; j <= a.length; j++) {
    let prev = dp[0]; dp[0] = j;
    for (let i = 1; i <= b.length; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[j-1] === b[i-1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function updateSearchSuggestions() {
  const term = searchInput.value.trim().toLowerCase();
  const cand = aplicarFiltrosCompletos();
  let sug;
  if (!term) {
    sug = ordenarEspecies(cand).slice(0, 6).map(e => e.nombre);
  } else {
    const comienzan = cand.filter(e => e.nombre.toLowerCase().startsWith(term));
    if (comienzan.length >= 6) {
      sug = comienzan.slice(0, 6).map(e => e.nombre);
    } else {
      const resto = cand
        .filter(e => !e.nombre.toLowerCase().startsWith(term))
        .map(e => ({ nombre: e.nombre, dist: levenshteinDistance(term, e.nombre.toLowerCase()) }))
        .sort((a, b) => a.dist - b.dist);
      sug = [
        ...comienzan.map(e => e.nombre),
        ...resto.slice(0, 6 - comienzan.length).map(x => x.nombre)
      ];
    }
  }
  searchDatalist.innerHTML = sug.map(s => `<option value="${s.replace(/"/g,'&quot;')}">`).join('');
}

function updateClearSearchState() {
  clearSearchBtn.classList.toggle("disabled", !searchInput.value.trim());
}

let _searchTimeout;
function onSearchInput() {
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(() => {
    searchTerm  = searchInput.value;
    currentPage = 1;
    render();
    updateClearSearchState();
    updateSearchSuggestions();
    invalidateBaseCache();
  }, 280);
}

/* ── Imagen de esquina ───────────────────────────────────── */
function actualizarImagenEsquina() {
  const src = window.innerWidth <= 700 ? 'img2/esquina.png' : 'img2/esquina.gif';
  if (headerCornerImg.getAttribute('src') !== src) headerCornerImg.src = src;
  headerCornerImg.onerror = () => headerCornerImg.style.display = 'none';
  headerCornerImg.onload  = () => headerCornerImg.style.display = 'block';
}

/* ── Ajuste de fuente en tarjetas y modal ────────────────── */
function adjustTitleFontSize() {
  const ruler = document.createElement('span');
  ruler.style.cssText = 'position:fixed;visibility:hidden;white-space:nowrap;font-family:Cinzel,serif;font-weight:700;padding:0 8px;pointer-events:none';
  document.body.appendChild(ruler);
  document.querySelectorAll('.card b').forEach(t => {
    const avail = t.clientWidth;
    if (!avail) return;
    ruler.textContent = t.textContent;
    let fs = 0.88;
    ruler.style.fontSize = fs + 'rem';
    while (fs > 0.68 && ruler.offsetWidth > avail) { fs -= 0.005; ruler.style.fontSize = fs + 'rem'; }
    if (ruler.offsetWidth > avail) { t.classList.add('wrap-name'); t.style.fontSize = '0.7rem'; }
    else { t.classList.remove('wrap-name'); t.style.fontSize = fs + 'rem'; }
  });
  ruler.remove();
}

function adjustModalTitleFontSize() {
  const h3 = modalTitle;
  if (!h3) return;
  const avail = h3.clientWidth;
  if (!avail) return;
  const test = document.createElement('span');
  test.style.cssText = `position:fixed;visibility:hidden;white-space:nowrap;font-family:"Cinzel",serif;font-weight:800;width:${avail}px;display:inline-block;pointer-events:none`;
  test.textContent = h3.textContent;
  document.body.appendChild(test);
  let fs = 1.25;
  test.style.fontSize = fs + 'rem';
  while (fs > 0.8 && test.scrollWidth > test.clientWidth) { fs -= 0.05; test.style.fontSize = fs + 'rem'; }
  if (test.scrollWidth > test.clientWidth) { h3.classList.add('wrap-name'); h3.style.fontSize = '0.8rem'; }
  else { h3.classList.remove('wrap-name'); h3.style.fontSize = fs + 'rem'; }
  test.remove();
}

/* ── Reposicionamiento de menús ──────────────────────────── */
function repositionMenu(menu, button) {
  if (!menu || !button) return;
  const r  = button.getBoundingClientRect();
  const mr = menu.getBoundingClientRect();
  const overflowsBottom = r.bottom + mr.height > window.innerHeight;
  const fitsAbove       = r.top > mr.height;
  menu.style.top    = (overflowsBottom && fitsAbove) ? 'auto' : '110%';
  menu.style.bottom = menu.style.top === 'auto' ? '110%' : 'auto';
  menu.style.left   = (r.left + mr.width > window.innerWidth) ? 'auto' : '0';
  menu.style.right  = menu.style.left === 'auto' ? '0' : 'auto';
}

/* ── Overlays de menú ────────────────────────────────────── */
function createMenuOverlay(zIndex, onClick) {
  removeMenuOverlay();
  const o = document.createElement('div');
  o.className = 'menu-overlay';
  o.style.zIndex = zIndex;
  o.onclick = onClick;
  document.body.appendChild(o);
  menuOverlay = o;
  mainHeader.style.zIndex = '201';
}

function removeMenuOverlay() {
  menuOverlay?.remove();
  menuOverlay = null;
  mainHeader.style.zIndex = HEADER_Z;
}

function closeAllMenus() {
  document.querySelectorAll(".filtro-menu,.config-menu,.orden-menu,.rev-filter-menu")
    .forEach(m => m.classList.remove("show"));
  removeMenuOverlay();
  hideTooltip();
}

function closeTempMenus() {
  document.querySelectorAll(".temp-floating-menu").forEach(m => {
    m.classList.remove("show");
    setTimeout(() => { if (!m.classList.contains("show")) m.remove(); }, 300);
  });
  if (csvMenu) csvMenu.classList.remove("show");
  ubicacionModal = epocaModal = subcategoriasModal = null;
  removeMenuOverlay();
  hideTooltip();
}

/* ── Debounce ────────────────────────────────────────────── */
const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const debouncedAdjustTitle   = debounce(adjustTitleFontSize, 100);
const debouncedImagenEsquina = debounce(actualizarImagenEsquina, 100);
