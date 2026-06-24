/* ═══════════════════════════════════════════════════════════
   creatures.js — Favoritos, revisados, tarjeta, modal, render
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Favoritos ───────────────────────────────────────────── */
function toggleFavorito(id, uiOnly = false) {
  favoritos.has(id) ? favoritos.delete(id) : favoritos.add(id);
  saveFavoritos();
  if (!uiOnly) {
    if (onlyFavorites) {
      render();
    } else {
      const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
      const favIcon = card?.querySelector(".fav-star");
      if (favIcon) favIcon.textContent = favoritos.has(id) ? "★" : "☆";
      if (currentModalCreature?.id === id && modalFavBtn)
        modalFavBtn.textContent = favoritos.has(id) ? "★" : "☆";
    }
  }
  updateFilterBadges();
  actualizarEstadoFavoritosYBoton();
  invalidateBaseCache();
}

/* ── Revisados ───────────────────────────────────────────── */
function toggleRevisado(id, esAuto = false) {
  const estaba = revisados.has(id);
  if (modoRevision === "bloqueo") {
    if (!esAuto && estaba && !confirm("¿Estás seguro de marcar como NO revisado?")) return;
    if (!esAuto && !estaba) return;
  }
  estaba ? revisados.delete(id) : revisados.add(id);
  saveRevisados();
  actualizarIconoRevisadoTarjeta(id);
  afterRevisadoToggle();
}

function afterRevisadoToggle() {
  invalidateBaseCache();
  actualizarEstadoBotonRevisado();
  const soloRevFilter = revFilterState.length > 0 && revFilterState.length < 2;
  if (soloRevFilter) {
    render();
  } else {
    updateFilterBadges(); regenerarMenus(); updateSearchSuggestions();
    actualizarContadorYPaginacion(); adjustTitleFontSize(); actualizarImagenEsquina();
    actualizarDisabledOtrosFiltros();
  }
}

function actualizarIconoRevisadoTarjeta(id) {
  const estado = revisados.has(id);
  const icono  = estado ? "◆" : "◇";
  const card   = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
  if (card) {
    const ri = card.querySelector(".revisado-icon");
    if (ri) {
      ri.innerHTML = icono;
      ri.className = `revisado-icon ${estado ? 'revisado' : 'no_revisado'}`;
      ri.title = estado ? "Revisado" : "No revisado";
    }
  }
  if (currentModalCreature?.id === id && modalRevisadoBtn) {
    modalRevisadoBtn.innerHTML = icono;
    modalRevisadoBtn.className = `revisado-icon ${estado ? 'revisado' : 'no_revisado'}`;
    modalRevisadoBtn.title = estado ? "Revisado" : "No revisado";
  }
}

function marcarRevisadoPorLink(id) {
  if (!revisados.has(id)) toggleRevisado(id, true);
}
window.marcarRevisadoPorLink = marcarRevisadoPorLink;

/* ── Limpiar filtros ─────────────────────────────────────── */
function limpiarCategoriaORevisados(cat) {
  if (cat === 'revisado') { revFilterState = []; saveRevFilterState(); }
  else { filtrosState[cat] = []; }
  currentPage = 1; persistState(); invalidateBaseCache(); render();
}

function limpiarTodosFiltros() {
  if (btnLimpiar.disabled) return;
  filtrosState = { morfologia:[], tipo:[], elemento:[], avistamiento:[], ubicacion:[], epoca:[], subcategorias:[] };
  revFilterState = []; saveRevFilterState(); currentPage = 1; persistState(); invalidateBaseCache(); render();
}

/* ── Tarjeta ─────────────────────────────────────────────── */
function crearCardGrid(e, idx) {
  const card   = document.createElement("div");
  card.className = "card";
  card.setAttribute("data-id", e.id);

  const imgC = document.createElement("div"); imgC.className = "img-container";
  imgC.appendChild(crearImg(e, idx < 12));

  const nombreB = document.createElement("b"); nombreB.textContent = e.nombre;

  const footer = document.createElement("div"); footer.className = "card-footer-row";
  const bw     = document.createElement("div"); bw.className = "badges-wrapper";
  crearBadgesRow(e).forEach(b => bw.appendChild(b));

  const ad  = document.createElement("div"); ad.className = "card-actions";
  const fb  = document.createElement("button"); fb.className = "fav-star";
  fb.textContent = favoritos.has(e.id) ? "★" : "☆";
  fb.setAttribute('aria-label', 'Marcar como favorito');
  fb.onclick = ev => { ev.stopPropagation(); toggleFavorito(e.id); };

  const ri  = document.createElement("span"); ri.className = "revisado-icon";
  const est = revisados.has(e.id);
  ri.innerHTML = est ? "◆" : "◇";
  ri.classList.toggle("revisado",    est);
  ri.classList.toggle("no_revisado", !est);
  ri.setAttribute('aria-label', est ? 'Revisado' : 'No revisado');
  ri.onclick = ev => { ev.stopPropagation(); ev.preventDefault(); toggleRevisado(e.id); };

  ad.append(fb, ri);
  footer.append(bw, ad);
  card.append(imgC, nombreB, footer);
  card.onclick = () => abrirDetalle(e);
  return card;
}

/* ── Paginación ──────────────────────────────────────────── */
function actualizarPaginacionHeader(tp) {
  paginationControlsDiv.innerHTML = "";
  const mkBtn = (t, d) => {
    const b = document.createElement("button");
    b.textContent = t; b.className = "pagination-btn"; b.disabled = d; return b;
  };
  const pi = document.createElement("input");
  pi.type = "text"; pi.inputMode = "numeric"; pi.value = currentPage;
  pi.setAttribute('aria-label', 'Número de página');
  const s = document.createElement("span"); s.textContent = `/ ${tp}`;

  if (tp <= 1) {
    pi.readOnly = true;
    paginationControlsDiv.append(mkBtn("«",true), mkBtn("‹",true), pi, s, mkBtn("›",true), mkBtn("»",true));
    return;
  }

  const goTo = v => {
    v = Math.max(1, Math.min(tp, v));
    if (v !== currentPage) { currentPage = v; render(); window.scrollTo({ top:0, behavior:'smooth' }); }
    pi.value = currentPage;
  };

  pi.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); goTo(parseInt(pi.value) || currentPage); pi.blur(); } });
  pi.addEventListener("input",   () => { pi.value = pi.value.replace(/[^0-9]/g,''); });
  pi.addEventListener("blur",    () => goTo(parseInt(pi.value) || currentPage));

  const bf = mkBtn("«", currentPage === 1);
  const bp = mkBtn("‹", currentPage === 1);
  const bn = mkBtn("›", currentPage === tp);
  const bl = mkBtn("»", currentPage === tp);
  if (tp === 2) { bf.disabled = true; bl.disabled = true; }

  bf.onclick = () => { if (!bf.disabled) goTo(1); };
  bp.onclick = () => { if (!bp.disabled) goTo(currentPage - 1); };
  bn.onclick = () => { if (!bn.disabled) goTo(currentPage + 1); };
  bl.onclick = () => { if (!bl.disabled) goTo(tp); };
  paginationControlsDiv.append(bf, bp, pi, s, bn, bl);
}

function actualizarContadorYPaginacion() {
  const total = currentOrderedList.length;
  const tp    = Math.max(1, Math.ceil(total / perPage));
  if (currentPage > tp) currentPage = tp;
  const start = (currentPage - 1) * perPage;
  const end   = Math.min(start + perPage, total);
  resultSpan.innerText = `${start + 1}-${end} / ${total}`;
  actualizarPaginacionHeader(tp);
}

/* ── Modal de detalle ────────────────────────────────────── */
function actualizarModal() {
  if (!currentModalCreature) return;
  const e = currentModalCreature;
  modalTitle.innerText = e.nombre;
  adjustModalTitleFontSize();
  setImageWithFallback(modalImg, e.nombre, e.foco, true, true);

  // Construir descripción de links con texto truncado visible
  const linksHtml = e.links?.length
    ? `<div class="links-list">${e.links.map(u =>
        `<a href="${u}" target="_blank" rel="noopener noreferrer" class="link-item" onclick="marcarRevisadoPorLink('${CSS.escape(e.id)}')">${u}</a>`
      ).join('')}</div>`
    : "";

  const subcatsHtml = e.subcategorias
    ? `<div class="info-item"><span class="info-label">Subcategorías:</span> ${e.subcategorias}</div>`
    : '';

  modalInfoScroll.innerHTML = `
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Morfología:</span> ${e.morfologia}</div>
      <div class="info-item"><span class="info-label">Tipo:</span> ${e.tipo}</div>
      <div class="info-item"><span class="info-label">Elemento:</span> ${e.elemento}</div>
      <div class="info-item"><span class="info-label">Avistamiento:</span> ${e.avistamiento}</div>
      <div class="info-item"><span class="info-label">Ubicación:</span> ${e.ubicacion || "?"}</div>
      <div class="info-item"><span class="info-label">Época:</span> ${e.epoca || "?"}</div>
      ${subcatsHtml}
    </div>
    <div class="modal-description">${e.descripcion}</div>
    ${linksHtml}`;

  const est = revisados.has(e.id);
  modalRevisadoBtn.innerHTML = est ? "◆" : "◇";
  modalRevisadoBtn.className = `revisado-icon ${est ? 'revisado' : 'no_revisado'}`;
  modalRevisadoBtn.onclick   = () => toggleRevisado(e.id, false);
  if (modalFavBtn) modalFavBtn.textContent = favoritos.has(e.id) ? "★" : "☆";
  modalPrevArrow.style.display = modalNextArrow.style.display = navegacionBloqueada ? "none" : "flex";
  actualizarFlechasModal();
  requestAnimationFrame(adjustModalTitleFontSize);
}

function abrirDetalle(e) {
  currentModalCreature = e;
  currentModalIndex    = currentOrderedList.findIndex(c => c.id === e.id);
  actualizarModal();
  actualizarFlechasModal();
  overlayEl.style.display = "flex";
  document.body.classList.add("modal-open");
  setTimeout(() => { overlayEl.classList.add("show"); adjustModalTitleFontSize(); }, 10);
}

function actualizarFlechasModal() {
  if (!currentOrderedList.length || navegacionBloqueada) return;
  modalPrevArrow.classList.toggle("disabled", currentModalIndex === 0);
  modalNextArrow.classList.toggle("disabled", currentModalIndex === currentOrderedList.length - 1);
}

function navegarModal(d) {
  if (navegacionBloqueada || !currentOrderedList.length) return;
  const ni = Math.max(0, Math.min(currentOrderedList.length - 1, currentModalIndex + d));
  if (ni !== currentModalIndex) {
    currentModalIndex    = ni;
    currentModalCreature = currentOrderedList[ni];
    actualizarModal();
    actualizarFlechasModal();
  }
}

async function closeModal() {
  const eraAleatorio = navegacionBloqueada;
  navegacionBloqueada = false;
  if (!eraAleatorio && currentModalCreature) {
    const idx = currentOrderedList.findIndex(c => c.id === currentModalCreature.id);
    if (idx !== -1) {
      const newPage = Math.floor(idx / perPage) + 1;
      if (newPage !== currentPage) { currentPage = newPage; await render(); }
      requestAnimationFrame(() => {
        document.querySelector(`.card[data-id="${CSS.escape(currentModalCreature.id)}"]`)
          ?.scrollIntoView({ behavior:'smooth', block:'center' });
      });
    }
  }
  overlayEl.classList.remove("show");
  document.body.classList.remove("modal-open");
  setTimeout(() => { if (!overlayEl.classList.contains("show")) overlayEl.style.display = "none"; }, 300);
}

/* ── Render principal ────────────────────────────────────── */
async function render() {
  if (!dataLoaded) return;

  gridDiv.classList.add("fade-out");
  await new Promise(r => setTimeout(r, 25));

  invalidateBaseCache();
  opcionesConDatosCache.cache.clear();

  const filtradas = aplicarFiltrosCompletos();
  const ordenadas = ordenarEspecies(filtradas);
  currentOrderedList = ordenadas;

  const total          = ordenadas.length;
  const favEnResultados = onlyFavorites ? total : ordenadas.filter(e => favoritos.has(e.id)).length;

  // Auto-corrección de estados inválidos
  let reRender = false;
  if (onlyFavorites && favEnResultados === 0) { onlyFavorites = false; reRender = true; }

  for (const estado of ["revisado","no_revisado"]) {
    const otro = estado === "revisado" ? "no_revisado" : "revisado";
    if (revFilterState.includes(estado) && !revFilterState.includes(otro) && contarPorEstado(estado) === 0) {
      revFilterState = revFilterState.filter(v => v !== estado);
      saveRevFilterState();
      reRender = true;
    }
  }

  if (reRender) { persistState(); render(); return; }

  const tp    = Math.max(1, Math.ceil(total / perPage));
  if (currentPage > tp) currentPage = tp;
  const start     = (currentPage - 1) * perPage;
  const paginated = ordenadas.slice(start, start + perPage);
  const end       = Math.min(start + perPage, total);

  resultSpan.innerText = `${start + 1}-${end} / ${total}`;
  gridDiv.className    = 'grid';
  gridDiv.innerHTML    = "";

  // Estado de botones
  const sinResultados = total === 0;
  document.querySelectorAll('.filtro-boton').forEach(b => { b.disabled = sinResultados; });
  if (!sinResultados) {
    btnOrden.disabled      = total === 1;
    favFilterBtn.disabled  = favoritos.size === 0 || favEnResultados === 0;
    btnLimpiar.disabled    = !Object.values(filtrosState).some(a => a.length) && !revFilterState.length;
    actualizarDisabledOtrosFiltros();
  } else {
    btnOrden.disabled = true; favFilterBtn.disabled = true;
    btnLimpiar.disabled = true; configBtn.disabled = true;
  }

  if (!paginated.length) {
    const nd = document.createElement("div"); nd.className = "no-results";
    nd.innerHTML = `
      <div>🜁 ${especies.length === 0
        ? 'No se pudieron cargar los datos desde dtsk/Datos*.json.'
        : 'No se encontraron criaturas con esos filtros.'}</div>
      <img src="img2/non.jpeg" alt="Sin resultados" loading="lazy">`;
    gridDiv.appendChild(nd);
  } else {
    const frag = document.createDocumentFragment();
    paginated.forEach((e, i) => frag.appendChild(crearCardGrid(e, i)));
    gridDiv.appendChild(frag);
  }

  actualizarPaginacionHeader(tp);
  gridDiv.classList.remove("fade-out");
  updateFilterBadges(); regenerarMenus(); updateSearchSuggestions();
  adjustTitleFontSize(); actualizarImagenEsquina();
}
