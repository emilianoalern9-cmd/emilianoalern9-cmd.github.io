/* ═══════════════════════════════════════════════════════════
   state.js — Estado global, localStorage, persistencia
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Estado de la app ───────────────────────────────────── */
let especies = [];
let dataLoaded = false;

let filtrosState = {
  morfologia: [], tipo: [], elemento: [], avistamiento: [],
  ubicacion: [], epoca: [], subcategorias: []
};

let revFilterState  = [];
let ordenActual     = "nombre_asc";
let perPage         = 24;
let currentPage     = 1;
let onlyFavorites   = false;
let searchTerm      = '';
let favoritos       = new Set();
let revisados       = new Set();
let modoRevision    = "automatico";  // "automatico" | "bloqueo"

let currentOrderedList   = [];
let currentModalCreature = null;
let currentModalIndex    = -1;
let navegacionBloqueada  = false;
let selectedCsvFields    = [...CSV_CAMPOS.filter(f => f !== 'nombre')];
let touchStartX          = 0;
let panelVisible         = true;

// Referencias a modales flotantes reutilizados
let csvMenu            = null;
let ubicacionModal     = null;
let epocaModal         = null;
let subcategoriasModal = null;
let menuOverlay        = null;

/* ── LocalStorage helpers ───────────────────────────────── */
const saveLocal = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* silently fail (private mode / quota) */ }
};

const loadLocal = k => {
  try {
    const v = localStorage.getItem(k);
    return v != null ? JSON.parse(v) : null;
  } catch { return null; }
};

/* ── Persist / load ─────────────────────────────────────── */
function persistState() {
  saveLocal('catalogo_filtros',  filtrosState);
  saveLocal('catalogo_orden',    ordenActual);
  saveLocal('catalogo_perpage',  perPage);
  saveLocal('catalogo_onlyFav',  onlyFavorites);
  saveRevFilterState();
}

const loadRevisados      = () => { const s = loadLocal('catalogo_revisados'); if (s) revisados = new Set(s); };
const saveRevisados      = () => saveLocal('catalogo_revisados', [...revisados]);
const loadFavoritos      = () => { const f = loadLocal('catalogo_favoritos'); if (f) { favoritos = new Set(f); actualizarEstadoFavoritosYBoton(); } };
const saveFavoritos      = () => { saveLocal('catalogo_favoritos', [...favoritos]); actualizarEstadoFavoritosYBoton(); };
const loadRevFilterState = () => { revFilterState = loadLocal('catalogo_rev_filter') || []; };
const saveRevFilterState = () => { saveLocal('catalogo_rev_filter', revFilterState); updateRevFilterBadge(); };
const loadModoRevision   = () => { const m = localStorage.getItem('catalogo_modo_revision'); if (m) modoRevision = m; };
const saveModoRevision   = () => localStorage.setItem('catalogo_modo_revision', modoRevision);

/* ── Versión / reset ────────────────────────────────────── */
function resetAllData() {
  try { localStorage.clear(); } catch { /* quota issues */ }
  filtrosState = { morfologia:[], tipo:[], elemento:[], avistamiento:[], ubicacion:[], epoca:[], subcategorias:[] };
  revFilterState = [];
  revisados.clear();
  favoritos.clear();
  onlyFavorites = false;
  ordenActual   = "nombre_asc";
  perPage       = 24;
  currentPage   = 1;
  searchTerm    = '';
  saveLocal('catalogo_version', STORAGE_VERSION);
  persistState();
  saveRevisados();
  saveFavoritos();
}

function checkVersion() {
  const v = loadLocal('catalogo_version');
  if (v !== STORAGE_VERSION) { resetAllData(); return false; }
  return true;
}

/* ── Validación de filtros contra datos reales ──────────── */
function validarFiltrosState() {
  if (!especies.length) return;
  const catSimples = ['morfologia','tipo','elemento','avistamiento','ubicacion','epoca'];
  for (const cat of catSimples) {
    const existentes = new Set(especies.map(e => e[cat]).filter(Boolean));
    if (filtrosState[cat]?.length)
      filtrosState[cat] = filtrosState[cat].filter(v => existentes.has(v));
  }
  const todasSubs = new Set();
  especies.forEach(e => {
    if (e.subcategorias)
      e.subcategorias.split(',').forEach(s => { const t = s.trim(); if (t) todasSubs.add(t); });
  });
  if (filtrosState.subcategorias?.length)
    filtrosState.subcategorias = filtrosState.subcategorias.filter(v => todasSubs.has(v));
  persistState();
}

/* ── Cargar estado persistido ───────────────────────────── */
function loadPersistedState() {
  if (!checkVersion()) return;
  const f = loadLocal('catalogo_filtros');
  if (f) filtrosState = f;
  ordenActual = loadLocal('catalogo_orden') || "nombre_asc";
  const pp = loadLocal('catalogo_perpage');
  if (pp) perPage = +pp;
  const of = loadLocal('catalogo_onlyFav');
  onlyFavorites = (of === true || of === 'true');
  loadRevFilterState();
  if (especies.length) validarFiltrosState();
  actualizarTooltipOrden();
  actualizarEstadoFavoritosYBoton();
}
