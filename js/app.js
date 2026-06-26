/* ═══════════════════════════════════════════════════════════
   app.js — Init, eventos globales, carga de datos
   ═══════════════════════════════════════════════════════════ */
'use strict';

function initMenus() {
  document.querySelectorAll(".filtro-group").forEach(g => {
    const b = g.querySelector(".filtro-boton,.config-btn");
    const m = g.querySelector(".filtro-menu,.config-menu,.orden-menu,.rev-filter-menu");
    const skipIds = ['btnUbicacion','btnEpoca','btnSubcategorias'];
    if (b && m && !skipIds.includes(b.id)) {
      b.addEventListener("click", e => {
        e.stopPropagation(); sfx.click();
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
  btnUbicacion.addEventListener("click",     e => { e.stopPropagation(); sfx.click(); abrirModalUbicacion(); });
  btnEpoca.addEventListener("click",         e => { e.stopPropagation(); sfx.click(); abrirModalEpoca(); });
  btnSubcategorias.addEventListener("click", e => { e.stopPropagation(); sfx.click(); abrirModalSubcategorias(); });
  document.addEventListener("click", e => {
    if (!e.target.closest(".filtro-group") && !e.target.closest(".temp-floating-menu"))
      { closeAllMenus(); closeTempMenus(); }
  });
}

/* ── Eventos principales ─────────────────────────────────── */
mainTitle.addEventListener("click", () => {
  panelVisible = !panelVisible;
  $('filtrosPanel').classList.toggle("oculto", !panelVisible);
  sfx.click(); actualizarImagenEsquina();
});

btnLimpiar.onclick   = limpiarTodosFiltros;
favFilterBtn.onclick = () => {
  if (!favFilterBtn.disabled) { onlyFavorites = !onlyFavorites; currentPage=1; sfx.filter(); render(); persistState(); invalidateBaseCache(); }
};

searchInput.addEventListener('input', onSearchInput);
clearSearchBtn.onclick = () => {
  if (clearSearchBtn.classList.contains("disabled")) return;
  searchInput.value=''; searchTerm=''; currentPage=1; sfx.click();
  render(); updateClearSearchState(); updateSearchSuggestions(); invalidateBaseCache();
};

cerrarBtn.onclick      = closeModal;
overlayEl.onclick      = e => { if (e.target===overlayEl) closeModal(); };
modalPrevArrow.onclick = () => navegarModal(-1);
modalNextArrow.onclick = () => navegarModal(1);
modalFavBtn.onclick    = () => { if (currentModalCreature) toggleFavorito(currentModalCreature.id); };

if (btnResetTotal) {
  btnResetTotal.addEventListener('click', () => {
    const hayAlgo = Object.values(filtrosState).some(a=>a.length)||revFilterState.length||onlyFavorites||searchTerm;
    if (!hayAlgo) return;
    filtrosState = {morfologia:[],tipo:[],elemento:[],avistamiento:[],ubicacion:[],epoca:[],subcategorias:[]};
    revFilterState=[]; saveRevFilterState(); onlyFavorites=false;
    searchInput.value=''; searchTerm=''; updateClearSearchState(); currentPage=1;
    sfx.close(); render(); persistState(); invalidateBaseCache();
  });
}

/* ── Teclado en modal ────────────────────────────────────── */
document.addEventListener("keydown", e => {
  if (!overlayEl.classList.contains("show")) return;
  if (e.key==="Escape") { closeModal(); return; }
  if (navegacionBloqueada) return;
  const ac = {
    ArrowLeft:  () => navegarModal(-1),
    ArrowRight: () => navegarModal(1),
    f: () => currentModalCreature && toggleFavorito(currentModalCreature.id),
    F: () => currentModalCreature && toggleFavorito(currentModalCreature.id),
    r: () => currentModalCreature && toggleRevisado(currentModalCreature.id),
    R: () => currentModalCreature && toggleRevisado(currentModalCreature.id),
    l: () => { if (currentModalCreature?.links?.length) { window.open(currentModalCreature.links[0],'_blank'); marcarRevisadoPorLink(currentModalCreature.id); } },
    L: () => { if (currentModalCreature?.links?.length) { window.open(currentModalCreature.links[0],'_blank'); marcarRevisadoPorLink(currentModalCreature.id); } }
  };
  if (ac[e.key]) { e.preventDefault(); ac[e.key](); }
});

/* ── Touch swipe en modal ────────────────────────────────── */
$('detalle').addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; }, {passive:true});
$('detalle').addEventListener("touchend",   e => {
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
  const datos=[]; let i=1;
  while (true) {
    try {
      const r = await fetch(`dtsk/Datos${i}.json`, {cache:'default'});
      if (!r.ok) break;
      const d = await r.json();
      datos.push(...(Array.isArray(d) ? d : [d]));
      i++;
    } catch { break; }
  }
  return datos;
}

async function cargarDatos() {
  gridDiv.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><span>Invocando seres…</span></div>';
  try {
    const raw = await cargarArchivosDesdeCarpeta();
    if (!raw.length) throw new Error('Sin datos en dtsk/Datos*.json');
    especies = raw.map((c,idx) => ({
      id:           c.id            || `criatura_${idx}_${Date.now()}_${Math.random()}`,
      nombre:       c.nombre        || 'Sin nombre',
      morfologia:   c.morfologia    || 'Desconocido',
      tipo:         c.tipo          || 'Desconocido',
      elemento:     c.elemento      || 'Desconocido',
      avistamiento: c.avistamiento  || 'Desconocido',
      ubicacion:    c.ubicacion     || '',
      epoca:        c.epoca         || '',
      subcategorias:c.subcategorias || '',
      descripcion:  c.descripcion   || '',
      links:        c.links         || [],
      foco:         c.foco          ?? 13
    }));
    dataLoaded = true;
    buildIndexes(); loadFavoritos(); loadRevisados(); loadModoRevision();
    loadPersistedState(); updateSearchSuggestions(); updateClearSearchState();
    regenerarMenus(); await render(); actualizarImagenEsquina(); addRippleListeners();

    // Deep-link por hash
    const hash = window.location.hash.substring(1);
    if (hash.startsWith("id=")) {
      const id = decodeURIComponent(hash.substring(3));
      const cr = especies.find(e => e.id===id);
      if (cr) setTimeout(()=>abrirDetalle(cr), 300);
    }
    window.scrollTo({top:0, behavior:'instant'});
  } catch(err) {
    console.error("Error cargando datos:", err);
    dataLoaded = true; render();
  }
}

/* ── Arranque ────────────────────────────────────────────── */
initParticles();
initMenus();
cargarDatos();
