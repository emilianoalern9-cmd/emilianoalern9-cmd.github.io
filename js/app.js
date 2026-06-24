/* ═══════════════════════════════════════════════════════════
   app.js — Inicialización, eventos, carga de datos
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Init de menús (event listeners de apertura) ─────────── */
function initMenus() {
  document.querySelectorAll(".filtro-group").forEach(g => {
    const b = g.querySelector(".filtro-boton,.config-btn");
    const m = g.querySelector(".filtro-menu,.config-menu,.orden-menu,.rev-filter-menu");
    const skipIds = ['btnUbicacion', 'btnEpoca', 'btnSubcategorias'];
    if (b && m && !skipIds.includes(b.id)) {
      b.addEventListener("click", e => {
        e.stopPropagation();
        const wasOpen = m.classList.contains("show");
        closeAllMenus();
        if (!wasOpen) {
          m.classList.add("show");
          createMenuOverlay(199, closeAllMenus);
          setTimeout(() => repositionMenu(m, b), 10);
        }
      });
    }
  });

  btnUbicacion.addEventListener("click",     e => { e.stopPropagation(); abrirModalUbicacion(); });
  btnEpoca.addEventListener("click",         e => { e.stopPropagation(); abrirModalEpoca(); });
  btnSubcategorias.addEventListener("click", e => { e.stopPropagation(); abrirModalSubcategorias(); });

  document.addEventListener("click", e => {
    if (!e.target.closest(".filtro-group") && !e.target.closest(".temp-floating-menu"))
      { closeAllMenus(); closeTempMenus(); }
  });
}

/* ── Event listeners globales ────────────────────────────── */
mainTitle.addEventListener("click", () => {
  panelVisible = !panelVisible;
  document.getElementById('filtrosPanel').classList.toggle("oculto", !panelVisible);
  actualizarImagenEsquina();
});

btnLimpiar.onclick   = limpiarTodosFiltros;
favFilterBtn.onclick = () => {
  if (!favFilterBtn.disabled) {
    onlyFavorites = !onlyFavorites;
    currentPage   = 1;
    render();
    persistState();
    invalidateBaseCache();
  }
};

searchInput.addEventListener('input', onSearchInput);

clearSearchBtn.onclick = () => {
  if (clearSearchBtn.classList.contains("disabled")) return;
  searchInput.value = '';
  searchTerm = '';
  currentPage = 1;
  render();
  updateClearSearchState();
  updateSearchSuggestions();
  invalidateBaseCache();
};

cerrarBtn.onclick     = closeModal;
overlayEl.onclick     = e => { if (e.target === overlayEl) closeModal(); };
modalPrevArrow.onclick = () => navegarModal(-1);
modalNextArrow.onclick = () => navegarModal(1);
modalFavBtn.onclick   = () => { if (currentModalCreature) toggleFavorito(currentModalCreature.id); };

if (btnResetTotal) {
  btnResetTotal.addEventListener('click', () => {
    const hayAlgo = Object.values(filtrosState).some(a => a.length) ||
                    revFilterState.length || onlyFavorites || searchTerm;
    if (!hayAlgo) return;
    filtrosState = { morfologia:[], tipo:[], elemento:[], avistamiento:[], ubicacion:[], epoca:[], subcategorias:[] };
    revFilterState = []; saveRevFilterState();
    onlyFavorites = false;
    searchInput.value = ''; searchTerm = '';
    updateClearSearchState();
    currentPage = 1;
    render();
    persistState();
    invalidateBaseCache();
  });
}

/* ── Teclado en modal ────────────────────────────────────── */
document.addEventListener("keydown", e => {
  if (!overlayEl.classList.contains("show")) return;
  if (e.key === "Escape") { closeModal(); return; }
  if (navegacionBloqueada) return;
  const acciones = {
    ArrowLeft:  () => navegarModal(-1),
    ArrowRight: () => navegarModal(1),
    f: () => currentModalCreature && toggleFavorito(currentModalCreature.id),
    F: () => currentModalCreature && toggleFavorito(currentModalCreature.id),
    r: () => currentModalCreature && toggleRevisado(currentModalCreature.id),
    R: () => currentModalCreature && toggleRevisado(currentModalCreature.id),
    l: () => { if (currentModalCreature?.links?.length) { window.open(currentModalCreature.links[0],'_blank'); marcarRevisadoPorLink(currentModalCreature.id); } },
    L: () => { if (currentModalCreature?.links?.length) { window.open(currentModalCreature.links[0],'_blank'); marcarRevisadoPorLink(currentModalCreature.id); } }
  };
  if (acciones[e.key]) { e.preventDefault(); acciones[e.key](); }
});

/* ── Touch (swipe en modal) ──────────────────────────────── */
document.getElementById('detalle').addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.getElementById('detalle').addEventListener("touchend", e => {
  if (navegacionBloqueada) return;
  const d = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(d) > 50) { navegarModal(d > 0 ? -1 : 1); e.preventDefault(); }
});

/* ── Resize ──────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (!dataLoaded) return;
  debouncedAdjustTitle();
  if (overlayEl.classList.contains("show")) adjustModalTitleFontSize();
  debouncedImagenEsquina();
});

/* ── Carga de datos ──────────────────────────────────────── */
async function cargarArchivosDesdeCarpeta() {
  const datos = []; let i = 1;
  while (true) {
    try {
      // Versión con caché: en producción usar cache:'default', solo forzar recarga si hay errores
      const r = await fetch(`dtsk/Datos${i}.json`, { cache: 'default' });
      if (!r.ok) break;
      const d = await r.json();
      datos.push(...(Array.isArray(d) ? d : [d]));
      i++;
    } catch { break; }
  }
  return datos;
}

async function cargarDatos() {
  // Mostrar spinner de carga
  gridDiv.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><span>Invocando seres…</span></div>';

  try {
    const raw = await cargarArchivosDesdeCarpeta();
    if (!raw.length) throw new Error('No se pudieron cargar datos desde dtsk/Datos*.json');

    especies = raw.map((c, idx) => ({
      id:            c.id            || `criatura_${idx}_${Date.now()}_${Math.random()}`,
      nombre:        c.nombre        || 'Sin nombre',
      morfologia:    c.morfologia    || 'Desconocido',
      tipo:          c.tipo          || 'Desconocido',
      elemento:      c.elemento      || 'Desconocido',
      avistamiento:  c.avistamiento  || 'Desconocido',
      ubicacion:     c.ubicacion     || '',
      epoca:         c.epoca         || '',
      subcategorias: c.subcategorias || '',
      descripcion:   c.descripcion   || '',
      links:         c.links         || [],
      foco:          c.foco          ?? 13
    }));

    dataLoaded = true;
    buildIndexes();
    loadFavoritos();
    loadRevisados();
    loadModoRevision();
    loadPersistedState();
    updateSearchSuggestions();
    updateClearSearchState();
    regenerarMenus();
    await render();

    // Sólo registrar resize después de que los datos estén cargados
    actualizarImagenEsquina();

    // Deep-link por hash
    const hash = window.location.hash.substring(1);
    if (hash.startsWith("id=")) {
      const id = decodeURIComponent(hash.substring(3));
      const cr = especies.find(e => e.id === id);
      if (cr) setTimeout(() => abrirDetalle(cr), 300);
    }

    window.scrollTo({ top:0, behavior:'instant' });

  } catch (err) {
    console.error("Error cargando datos:", err);
    dataLoaded = true;
    render();
  }
}

/* ── Arranque ────────────────────────────────────────────── */
initMenus();
cargarDatos();
