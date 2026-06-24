/* ═══════════════════════════════════════════════════════════
   cache.js — Índices invertidos, caché de filtros, predicados
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Índices ─────────────────────────────────────────────── */
let idxMorfologia, idxTipo, idxElemento, idxAvistamiento,
    idxUbicacion, idxEpoca, idxSubcategorias;

function buildIndexes() {
  idxMorfologia    = new Map();
  idxTipo          = new Map();
  idxElemento      = new Map();
  idxAvistamiento  = new Map();
  idxUbicacion     = new Map();
  idxEpoca         = new Map();
  idxSubcategorias = new Map();

  for (const e of especies) {
    const id = e.id;
    addToIndex(idxMorfologia,   e.morfologia,   id);
    addToIndex(idxTipo,         e.tipo,         id);
    addToIndex(idxElemento,     e.elemento,     id);
    addToIndex(idxAvistamiento, e.avistamiento, id);
    if (e.ubicacion) addToIndex(idxUbicacion, e.ubicacion, id);
    if (e.epoca)     addToIndex(idxEpoca,     e.epoca,     id);
    if (e.subcategorias)
      e.subcategorias.split(',').forEach(s => {
        const t = s.trim(); if (t) addToIndex(idxSubcategorias, t, id);
      });
  }
}

const addToIndex = (map, key, id) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(id);
};

/* ── Caché de versión ────────────────────────────────────── */
let baseFilterVersion = 0;
let cachedBaseIds     = null;
let cachedBaseVersion = -1;
let cachedIgnoreCat   = null;
let filterCountCache  = new Map();
let revCountCache     = { revisado: -1, no_revisado: -1 };

/* Caché de conteo de opciones visibles por categoría */
const opcionesConDatosCache = { cache: new Map() };

function invalidateBaseCache() {
  baseFilterVersion++;
  filterCountCache.clear();
  revCountCache = { revisado: -1, no_revisado: -1 };
  opcionesConDatosCache.cache.clear();
}

/* ── Base filtrada con caché ─────────────────────────────── */
function getBaseFilteredIds(ignoreCat = null) {
  if (
    baseFilterVersion === cachedBaseVersion &&
    ignoreCat === cachedIgnoreCat &&
    cachedBaseIds !== null
  ) return cachedBaseIds;

  const pred = buildPredicate(ignoreCat);
  const ids  = new Set();
  for (const e of especies) if (pred(e)) ids.add(e.id);

  cachedBaseIds     = ids;
  cachedBaseVersion = baseFilterVersion;
  cachedIgnoreCat   = ignoreCat;
  return ids;
}

/* ── Predicado de filtro ─────────────────────────────────── */
function buildPredicate(ignoreCat = null) {
  // Precalcular sets de subcategorías seleccionadas para lookup O(1)
  const subSet = filtrosState.subcategorias.length
    ? new Set(filtrosState.subcategorias)
    : null;

  return e => {
    if (ignoreCat !== 'morfologia'   && filtrosState.morfologia.length   && !filtrosState.morfologia.includes(e.morfologia))   return false;
    if (ignoreCat !== 'tipo'         && filtrosState.tipo.length         && !filtrosState.tipo.includes(e.tipo))               return false;
    if (ignoreCat !== 'elemento'     && filtrosState.elemento.length     && !filtrosState.elemento.includes(e.elemento))       return false;
    if (ignoreCat !== 'avistamiento' && filtrosState.avistamiento.length && !filtrosState.avistamiento.includes(e.avistamiento)) return false;
    if (ignoreCat !== 'ubicacion'    && filtrosState.ubicacion.length    && !filtrosState.ubicacion.includes(e.ubicacion))     return false;
    if (ignoreCat !== 'epoca'        && filtrosState.epoca.length        && !filtrosState.epoca.includes(e.epoca))             return false;

    if (ignoreCat !== 'subcategorias' && subSet) {
      const subcats = e.subcategorias
        ? e.subcategorias.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      if (!subcats.some(s => subSet.has(s))) return false;
    }

    if (onlyFavorites && !favoritos.has(e.id)) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (!e.nombre.toLowerCase().includes(term)) return false;
    }

    if (revFilterState.length && ignoreCat !== 'revisado') {
      const r    = revisados.has(e.id);
      const ambos = revFilterState.includes("revisado") && revFilterState.includes("no_revisado");
      if (!ambos) {
        if (revFilterState.includes("revisado")    && !r) return false;
        if (revFilterState.includes("no_revisado") &&  r) return false;
      }
    }

    return true;
  };
}

/* ── Contadores con caché ────────────────────────────────── */
function contarConOpcion(categoria, opcion) {
  const key = `${categoria}___${opcion}`;
  if (filterCountCache.has(key)) return filterCountCache.get(key);

  const baseIds = getBaseFilteredIds(categoria);
  if (!baseIds.size) { filterCountCache.set(key, 0); return 0; }

  const idxMap = {
    morfologia: idxMorfologia, tipo: idxTipo, elemento: idxElemento,
    avistamiento: idxAvistamiento, ubicacion: idxUbicacion,
    epoca: idxEpoca, subcategorias: idxSubcategorias
  }[categoria];

  const opSet = idxMap?.get(opcion);
  let count = 0;
  if (opSet?.size) {
    const [small, big] = baseIds.size < opSet.size ? [baseIds, opSet] : [opSet, baseIds];
    for (const id of small) if (big.has(id)) count++;
  }
  filterCountCache.set(key, count);
  return count;
}

function contarPorEstado(estado) {
  if (revCountCache[estado] !== -1) return revCountCache[estado];
  const baseIds = getBaseFilteredIds(null);
  let count = 0;
  for (const id of baseIds) {
    const r = revisados.has(id);
    if (estado === "revisado" ? r : !r) count++;
  }
  revCountCache[estado] = count;
  return count;
}

function getCachedOpcionesConDatos(categoria) {
  if (opcionesConDatosCache.cache.has(categoria))
    return opcionesConDatosCache.cache.get(categoria);

  let result;
  if (categoria === 'revisado') {
    result = (contarPorEstado("revisado") > 0 ? 1 : 0) +
             (contarPorEstado("no_revisado") > 0 ? 1 : 0);
  } else if (['ubicacion','epoca','subcategorias'].includes(categoria)) {
    const valores = obtenerValoresCategoria(categoria);
    result = valores.filter(op => contarConOpcion(categoria, op) > 0).length;
  } else {
    result = CATEGORIAS[categoria]?.options.filter(
      op => contarConOpcion(categoria, op) > 0
    ).length ?? 0;
  }
  opcionesConDatosCache.cache.set(categoria, result);
  return result;
}

/* ── Valores únicos por categoría ───────────────────────── */
function obtenerValoresCategoria(categoria) {
  if (categoria === 'ubicacion')
    return [...new Set(especies.map(e => e.ubicacion).filter(Boolean))].sort();
  if (categoria === 'epoca')
    return [...new Set(especies.map(e => e.epoca).filter(Boolean))].sort();
  if (categoria === 'subcategorias') {
    const todas = new Set();
    especies.forEach(e => {
      if (e.subcategorias)
        e.subcategorias.split(',').forEach(s => { const t = s.trim(); if (t) todas.add(t); });
    });
    return [...todas].sort();
  }
  return CATEGORIAS[categoria]?.options ?? [];
}

/* ── Filtrado y ordenamiento ─────────────────────────────── */
const aplicarFiltrosCompletos = () => especies.filter(buildPredicate());

function ordenarEspecies(lista) {
  const [campo, dir] = ordenActual.split('_');
  const order = dir === "asc" ? 1 : -1;
  return [...lista].sort((a, b) => {
    const va = (a[campo] || '').toLowerCase();
    const vb = (b[campo] || '').toLowerCase();
    if (va < vb) return -order;
    if (va > vb) return  order;
    return 0;
  });
}
