/* ═══════════════════════════════════════════════════════════
   menus.js — Constructores de menús, modales, CSV, ayuda
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── Menú de categoría (solo muestra opciones con datos) ─── */
function generarMenuCategoria(cat, menuId) {
  const menu = document.getElementById(menuId); menu.innerHTML = "";
  const opciones = CATEGORIAS[cat]?.options ?? [];
  // Solo mostrar opciones que tengan al menos 1 resultado en la base actual
  const opcionesVisibles = opciones.filter(v => contarConOpcion(cat, v) > 0);
  const solaUna = opcionesVisibles.length === 1;

  opcionesVisibles.forEach(val => {
    const count = contarConOpcion(cat, val);
    const ico   = getIcon(cat, val);
    const label = document.createElement("label");
    const cb    = document.createElement("input"); cb.type="checkbox"; cb.value=val;
    cb.checked  = filtrosState[cat].includes(val); cb.disabled = solaUna;
    cb.addEventListener("change", () => {
      cb.checked ? (!filtrosState[cat].includes(val) && filtrosState[cat].push(val))
                 : (filtrosState[cat] = filtrosState[cat].filter(v => v!==val));
      sfx.filter(); currentPage=1; render(); persistState(); invalidateBaseCache();
    });
    const ts = document.createElement("span"); ts.className="label-text"; ts.textContent = ` ${ico} ${val}`;
    const cs = document.createElement("span"); cs.className="count"; cs.textContent = `(${count})`;
    label.append(cb, ts, cs); menu.appendChild(label);
  });

  if (opcionesVisibles.length === 0) {
    const em = document.createElement("div");
    em.style.cssText = "padding:8px;font-size:.7rem;color:var(--text-muted);text-align:center;font-family:Cinzel,serif";
    em.textContent = "Sin opciones disponibles"; menu.appendChild(em);
  }

  const bc = document.createElement("button"); bc.textContent="Limpiar"; bc.className="limpiar-categoria";
  bc.disabled = !filtrosState[cat].length;
  bc.addEventListener('click', e => { e.stopPropagation(); limpiarCategoriaORevisados(cat); });
  menu.appendChild(bc);
}

/* ── Menú de revisados (solo muestra opciones con datos) ─── */
function generarRevFilterMenu() {
  revFilterMenu.innerHTML = "";
  const ops = [
    { id:"revisado",    label:"Revisado",    ico:"◆" },
    { id:"no_revisado", label:"No revisado", ico:"◇" }
  ];
  const visibles = ops.filter(o => contarPorEstado(o.id) > 0);
  const solaUna  = visibles.length === 1;

  visibles.forEach(opt => {
    const count = contarPorEstado(opt.id);
    const label = document.createElement("label");
    const cb    = document.createElement("input"); cb.type="checkbox"; cb.value=opt.id;
    cb.checked  = revFilterState.includes(opt.id); cb.disabled = solaUna;
    cb.addEventListener("change", () => {
      cb.checked ? (!revFilterState.includes(opt.id) && revFilterState.push(opt.id))
                 : (revFilterState = revFilterState.filter(v => v!==opt.id));
      sfx.filter(); saveRevFilterState(); currentPage=1; render(); invalidateBaseCache();
    });
    const ts = document.createElement("span"); ts.className="label-text"; ts.textContent=` ${opt.ico} ${opt.label}`;
    const cs = document.createElement("span"); cs.className="count"; cs.textContent=`(${count})`;
    label.append(cb, ts, cs); revFilterMenu.appendChild(label);
  });

  const bc = document.createElement("button"); bc.textContent="Limpiar"; bc.className="limpiar-categoria";
  bc.disabled = !revFilterState.length;
  bc.addEventListener('click', e => { e.stopPropagation(); limpiarCategoriaORevisados('revisado'); });
  revFilterMenu.appendChild(bc);
}

/* ── Menú de orden ───────────────────────────────────────── */
function generarMenuOrden() {
  ordenMenu.innerHTML = ORDEN_OPCIONES.map(o =>
    `<button ${ordenActual===o.v?'disabled':''}>${o.l}${ordenActual===o.v?' ◉':''}</button>`
  ).join('');
  [...ordenMenu.children].forEach((b,i) => {
    b.onclick = () => {
      if (b.disabled) return;
      ordenActual = ORDEN_OPCIONES[i].v; sfx.click();
      currentPage=1; actualizarTooltipOrden(); render(); persistState(); closeAllMenus(); invalidateBaseCache();
    };
  });
}

/* ── Menú de config ──────────────────────────────────────── */
function generarMenuConfig() {
  configMenu.innerHTML = "";
  const addBtn = (html, click) => {
    const b = document.createElement("button"); b.innerHTML = html; b.onclick = click; configMenu.appendChild(b); return b;
  };
  addBtn("🎲 Azar", () => {
    const f = aplicarFiltrosCompletos();
    if (f.length) { navegacionBloqueada=true; sfx.open(); abrirDetalle(f[Math.floor(Math.random()*f.length)]); }
    closeAllMenus();
  });
  addBtn(`🔢 Ítems por página (${perPage})`, e => { e.stopPropagation(); closeAllMenus(); abrirMenuItemsPerPage(); });
  addBtn("📎 Exportar CSV", e => { e.stopPropagation(); closeAllMenus(); crearMenuCSV(); csvMenu.classList.add("show"); });
  addBtn("💾 Exportar progreso", e => { e.stopPropagation(); closeAllMenus(); exportarProgreso(); });
  addBtn("📂 Importar progreso", e => { e.stopPropagation(); closeAllMenus(); importarProgreso(); });
  addBtn(`📌 Modo revisión (${modoRevision==="automatico"?"Automático":"Bloqueo"})`, e => {
    e.stopPropagation(); modoRevision = modoRevision==="automatico"?"bloqueo":"automatico";
    saveModoRevision(); generarMenuConfig(); closeAllMenus();
  });
  addBtn("📖 Ayuda", e => { e.stopPropagation(); closeAllMenus(); abrirMenuAyuda(); });
}

/* ── Regenerar todos ─────────────────────────────────────── */
function regenerarMenus() {
  generarMenuCategoria('morfologia',   'menu-morfologia');
  generarMenuCategoria('tipo',         'menu-tipo');
  generarMenuCategoria('elemento',     'menu-elemento');
  generarMenuCategoria('avistamiento', 'menu-avistamiento');
  generarMenuOrden(); generarMenuConfig(); generarRevFilterMenu();
  csvMenu?.remove(); crearMenuCSV();
}

/* ── Modal de filtro genérico ────────────────────────────── */
function aplicarCambioModalFiltro(cat, nuevosValores, totalVisibles) {
  const antesTotal   = !filtrosState[cat].length || filtrosState[cat].length===totalVisibles;
  const despuesTotal = !nuevosValores.length || nuevosValores.length===totalVisibles;
  filtrosState[cat] = nuevosValores; currentPage=1;
  sfx.filter(); persistState(); invalidateBaseCache();
  if (antesTotal && despuesTotal) {
    updateFilterBadges(); regenerarMenus(); updateSearchSuggestions();
    actualizarContadorYPaginacion(); adjustTitleFontSize(); actualizarImagenEsquina();
  } else { render(); }
}

function crearModalFiltro(titulo, cat, valores, counts) {
  closeAllMenus(); closeTempMenus();
  createMenuOverlay(999, () => closeTempMenus());
  const modal = document.createElement('div'); modal.className='temp-floating-menu'; modal.id=cat+'Modal';
  const opcionesConDatos = valores.filter(v => counts.get(v) > 0);
  const totalVisibles    = opcionesConDatos.length;

  let html = `<div class="temp-header">${titulo} <button id="${cat}CancelBtn" title="Cerrar">✕</button></div>
    <div class="modal-checkbox-grid" id="${cat}Grid">`;
  opcionesConDatos.forEach(val => {
    const sv = val.replace(/"/g,'&quot;');
    html += `<label><input type="checkbox" value="${sv}" ${filtrosState[cat].includes(val)?'checked':''} ${totalVisibles===1?'disabled':''}> ${val} <span style="color:var(--text-muted);font-size:.6rem">(${counts.get(val)})</span></label>`;
  });
  html += `</div><div class="modal-actions" id="${cat}Actions"></div>`;
  modal.innerHTML = html;
  document.body.appendChild(modal); modal.classList.add('show');
  if (cat==='ubicacion')          ubicacionModal = modal;
  else if (cat==='epoca')         epocaModal = modal;
  else if (cat==='subcategorias') subcategoriasModal = modal;

  const grid=modal.querySelector(`#${cat}Grid`), actDiv=modal.querySelector(`#${cat}Actions`);
  const mk=(icon,title)=>{ const b=document.createElement('button'); b.textContent=icon; b.title=title; b.setAttribute('aria-label',title); return b; };
  const sa=mk('📋','Seleccionar todo'), da=mk('🗑️','Deseleccionar todo'), inv=mk('🔄','Invertir selección');
  actDiv.append(sa,da,inv);
  const getChecks  = () => grid.querySelectorAll('input[type="checkbox"]:not([disabled])');
  const getSelected= () => Array.from(getChecks()).filter(cb=>cb.checked).map(cb=>cb.value);
  const syncBotones= () => { const checks=getChecks(); const n=Array.from(checks).filter(cb=>cb.checked).length; sa.disabled=n===checks.length; da.disabled=n===0; };
  grid.addEventListener('change', () => { aplicarCambioModalFiltro(cat, getSelected(), totalVisibles); syncBotones(); });
  sa.onclick  = () => { getChecks().forEach(cb=>cb.checked=true);  aplicarCambioModalFiltro(cat, getSelected(), totalVisibles); syncBotones(); };
  da.onclick  = () => { getChecks().forEach(cb=>cb.checked=false); aplicarCambioModalFiltro(cat, [], totalVisibles); syncBotones(); };
  inv.onclick = () => { const ns=[]; getChecks().forEach(cb=>{ cb.checked=!cb.checked; if(cb.checked) ns.push(cb.value); }); aplicarCambioModalFiltro(cat, ns, totalVisibles); syncBotones(); };
  modal.querySelector(`#${cat}CancelBtn`).onclick = () => closeTempMenus();
  modal.addEventListener('click', e => e.stopPropagation());
  syncBotones();
}

const abrirModalUbicacion     = () => { const v=obtenerValoresCategoria('ubicacion');     const c=new Map(v.map(x=>[x,contarConOpcion('ubicacion',x)]));     crearModalFiltro('📍 Ubicación','ubicacion',v,c); };
const abrirModalEpoca         = () => { const v=obtenerValoresCategoria('epoca');         const c=new Map(v.map(x=>[x,contarConOpcion('epoca',x)]));         crearModalFiltro('📅 Época','epoca',v,c); };
const abrirModalSubcategorias = () => { const v=obtenerValoresCategoria('subcategorias'); const c=new Map(v.map(x=>[x,contarConOpcion('subcategorias',x)])); crearModalFiltro('🏷️ Subcategorías','subcategorias',v,c); };

/* ── CSV ─────────────────────────────────────────────────── */
function crearMenuCSV() {
  csvMenu?.remove(); csvMenu = document.createElement("div");
  csvMenu.id="csvModal"; csvMenu.className="temp-floating-menu";
  renderMenuCSV(); document.body.appendChild(csvMenu);
  csvMenu.addEventListener("click", e => e.stopPropagation());
}
function renderMenuCSV() {
  if (!csvMenu) return;
  const camposVisibles = CSV_CAMPOS.filter(f => f!=='nombre');
  csvMenu.innerHTML = `
    <div class="temp-header">📎 Exportar CSV <span style="font-size:.62rem;color:var(--text-muted)">(nombre siempre)</span>
      <button id="csvCloseBtn" title="Cerrar">✕</button></div>
    <div class="csv-checkbox-group">${camposVisibles.map(f =>
      `<label><input type="checkbox" value="${f}" ${selectedCsvFields.includes(f)?'checked':''}> ${f}</label>`
    ).join('')}</div>`;
  const cg=csvMenu.querySelector(".csv-checkbox-group");
  const ad=document.createElement("div"); ad.className="temp-actions";
  const sa=document.createElement("button"); sa.textContent="📋"; sa.title="Seleccionar todo";
  const da=document.createElement("button"); da.textContent="🗑️"; da.title="Deseleccionar todo";
  const inv=document.createElement("button"); inv.textContent="🔄"; inv.title="Invertir selección";
  const ok=document.createElement("button"); ok.textContent="✓"; ok.title="Exportar"; ok.disabled=!selectedCsvFields.length;
  ad.append(sa,da,inv,ok); csvMenu.appendChild(ad);
  const sync=()=>{ const n=cg.querySelectorAll("input:checked").length, t=cg.querySelectorAll("input").length; sa.disabled=n===t; da.disabled=n===0; ok.disabled=!selectedCsvFields.length; };
  cg.addEventListener("change",()=>{ selectedCsvFields=[...cg.querySelectorAll("input:checked")].map(c=>c.value); sync(); });
  sa.onclick=()=>{ selectedCsvFields=[...camposVisibles]; cg.querySelectorAll("input").forEach(c=>c.checked=true); sync(); };
  da.onclick=()=>{ selectedCsvFields=[]; cg.querySelectorAll("input").forEach(c=>c.checked=false); sync(); };
  inv.onclick=()=>{ selectedCsvFields=[]; cg.querySelectorAll("input").forEach(c=>{ if(!c.checked) selectedCsvFields.push(c.value); c.checked=!c.checked; }); sync(); };
  ok.onclick=()=>{ exportarCSV(); closeTempMenus(); };
  csvMenu.querySelector('#csvCloseBtn').onclick=()=>closeTempMenus();
  sync();
}
function exportarCSV() {
  if (!dataLoaded) return;
  const ordenadas = ordenarEspecies(aplicarFiltrosCompletos()); if (!ordenadas.length) return;
  const headers = ['nombre',...selectedCsvFields]; if (!headers.length) return;
  const rows = [headers.join(",")];
  ordenadas.forEach(e => {
    rows.push(headers.map(h => {
      let v = h==="links" ? (e.links?.join(";") ?? "") : (e[h] ?? "");
      if (typeof v==="string" && (v.includes(",")||v.includes("\n")||v.includes('"')))
        v = `"${v.replace(/"/g,'""')}"`;
      return v;
    }).join(","));
  });
  const link=document.createElement("a");
  link.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
  link.download=`indice_seres_${new Date().toISOString().slice(0,10)}.csv`;
  link.click(); URL.revokeObjectURL(link.href);
}

/* ── Exportar/Importar progreso ──────────────────────────── */
function exportarProgreso() {
  const datos={version:STORAGE_VERSION,fecha:new Date().toISOString(),favoritos:[...favoritos],revisados:[...revisados]};
  const link=document.createElement("a");
  link.href=URL.createObjectURL(new Blob([JSON.stringify(datos,null,2)],{type:"application/json"}));
  link.download=`progreso_seres_${new Date().toISOString().slice(0,10)}.json`;
  link.click(); URL.revokeObjectURL(link.href);
}
function importarProgreso() {
  const input=document.createElement("input"); input.type="file"; input.accept=".json,application/json";
  input.onchange=()=>{
    const file=input.files[0]; if (!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        const datos=JSON.parse(ev.target.result);
        if (!Array.isArray(datos.favoritos)||!Array.isArray(datos.revisados)) throw new Error("Formato inválido");
        closeAllMenus(); closeTempMenus();
        createMenuOverlay(999,()=>closeTempMenus());
        const modal=document.createElement("div"); modal.className="temp-floating-menu"; modal.id="importModal";
        modal.innerHTML=`<div class="temp-header">📂 Importar <button id="importCancelBtn" title="Cerrar">✕</button></div>
          <div style="font-size:.8rem;color:var(--text-secondary);line-height:1.8;padding:4px 0">
            <div>⭐ Favoritos: <strong style="color:var(--accent)">${datos.favoritos.length}</strong></div>
            <div>◆ Revisados: <strong style="color:var(--accent)">${datos.revisados.length}</strong></div>
          </div>
          <div class="temp-actions" id="importActions"></div>`;
        document.body.appendChild(modal); modal.classList.add("show");
        modal.querySelector("#importCancelBtn").onclick=()=>closeTempMenus();
        modal.addEventListener("click",e=>e.stopPropagation());
        const actDiv=modal.querySelector("#importActions");
        const b1=document.createElement("button"); b1.title="Combinar";  b1.innerHTML="🔀";
        const b2=document.createElement("button"); b2.title="Reemplazar"; b2.innerHTML="♻️";
        [b1,b2].forEach(b=>{
          b.style.fontSize="1.1rem";
          b.addEventListener("mouseenter",()=>{const r=b.getBoundingClientRect(); showTooltip(b.title,r.left+r.width/2,r.top-10,2000);});
          b.addEventListener("mouseleave",()=>hideTooltip());
        });
        b1.onclick=()=>{ datos.favoritos.forEach(id=>favoritos.add(id)); datos.revisados.forEach(id=>revisados.add(id)); saveFavoritos(); saveRevisados(); closeTempMenus(); invalidateBaseCache(); render(); };
        b2.onclick=()=>{ if (!confirm("¿Reemplazar datos actuales?")) return; favoritos=new Set(datos.favoritos); revisados=new Set(datos.revisados); saveFavoritos(); saveRevisados(); closeTempMenus(); invalidateBaseCache(); render(); };
        actDiv.append(b1,b2);
      } catch(err) { alert("Error: "+err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ── Ítems por página ────────────────────────────────────── */
function abrirMenuItemsPerPage() {
  closeAllMenus(); closeTempMenus();
  createMenuOverlay(999,()=>closeTempMenus());
  const valores=[12,24,48,96]; const sliderIdx=Math.max(0,valores.indexOf(perPage)); let tempPP=perPage;
  const menu=document.createElement("div"); menu.id="itemsPerPageMenu"; menu.className="temp-floating-menu";
  menu.innerHTML=`
    <div class="temp-header">🔢 Ítems por página <button id="itemsCancelBtn" title="Cancelar">✕</button></div>
    <div class="slider-container"><input type="range" id="itemsSlider" min="0" max="3" step="1" value="${sliderIdx}">
    <div class="slider-labels"><span>12</span><span>24</span><span>48</span><span>96</span></div></div>
    <div class="temp-value">Seleccionado: <strong id="itemsTempVal">${tempPP}</strong></div>
    <div class="temp-actions"><button id="itemsAcceptBtn" title="Aceptar" disabled>✓</button></div>`;
  document.body.appendChild(menu); menu.classList.add('show');
  const slider=menu.querySelector("#itemsSlider"), valSpan=menu.querySelector("#itemsTempVal"), ok=menu.querySelector("#itemsAcceptBtn");
  slider.addEventListener("input",()=>{ tempPP=valores[+slider.value]; valSpan.textContent=tempPP; ok.disabled=tempPP===perPage; });
  ok.onclick=()=>{ if (!ok.disabled) { perPage=tempPP; currentPage=1; render(); persistState(); generarMenuConfig(); closeTempMenus(); } };
  menu.querySelector("#itemsCancelBtn").onclick=()=>closeTempMenus();
  menu.addEventListener("click",e=>e.stopPropagation());
}

/* ── Ayuda ───────────────────────────────────────────────── */
function abrirMenuAyuda() {
  closeAllMenus(); closeTempMenus();
  createMenuOverlay(999,()=>closeTempMenus());
  const menu=document.createElement("div"); menu.id="helpFloatingMenu"; menu.className="temp-floating-menu";
  menu.innerHTML=`<div class="temp-header">📖 Leyenda <button id="helpCloseBtn" title="Cerrar">✕</button></div>
    <div class="help-content">
      <p><strong>🦴 Morfología</strong> — Forma física: Humano 🧑 Humanoide 🧝 Mamífero 🦌 Híbrido 🦄 Ave 🕊️ Reptil 🐍 Pez 🐟 Insecto 🦗 Amorfo 🌀 Etéreo 🌫️ Artificial 🤖 Otro 🔮</p>
      <p><strong>🌙 Tipo</strong> — Mitológico 🏛️ · Criptido 🐾 · Difuso 🌑</p>
      <p><strong>💧 Elemento</strong> — Aéreo 💨 Acuático 💧 Terrestre 🌿 Subterráneo ⛏️ Anfibio 🐸 Misceláneo ⚗️</p>
      <p><strong>👁️ Avistamiento</strong> — Grabado 📹 Documentado 📜 Crónicas 📖 Avistamiento 👁️ Ficción 📚 Tradición oral 🗣️ Difuso 🌀</p>
      <p><strong>📍 Ubicación</strong> — Región o país de origen</p>
      <p><strong>📅 Época</strong> — Período histórico</p>
      <p><strong>🏷️ Subcategorías</strong> — Etiquetas temáticas</p>
      <p><strong>◆ / ◇</strong> — Revisado / No revisado</p>
      <p><strong>★ / ☆</strong> — Favorito / No favorito</p>
      <p style="margin-top:6px;font-size:.68rem;color:var(--text-muted)">Teclado en modal: ← → navegar · F fav · R revisado · L enlace · Esc cerrar</p>
    </div>`;
  document.body.appendChild(menu); menu.classList.add('show');
  menu.querySelector('#helpCloseBtn').onclick=()=>closeTempMenus();
  menu.addEventListener('click',e=>e.stopPropagation());
}

function abrirVentanaAyudaEsquina() {
  closeAllMenus(); closeTempMenus(); $('ayudaEsquinaMenu')?.remove();
  createMenuOverlay(999,()=>closeTempMenus());
  const menu=document.createElement('div'); menu.id='ayudaEsquinaMenu'; menu.className='temp-floating-menu';
  menu.innerHTML=`<div class="temp-header">CONTACTO <button id="ayudaEsquinaCerrarBtn" title="Cerrar">✕</button></div>
    <div class="help-content">
      <p>Si encuentras errores, quieres sugerir criaturas o aportar información, escríbeme.</p>
      <p style="text-align:center;color:var(--accent);margin-bottom:12px;">@gmail.com</p>
      <div style="display:flex;justify-content:center;">
        <img src="img2/anuncio1.gif" alt="Anuncio" loading="eager" fetchpriority="high" style="max-width:200px;width:100%;height:auto;">
      </div>
    </div>`;
  document.body.appendChild(menu); menu.classList.add('show');
  menu.querySelector('#ayudaEsquinaCerrarBtn').onclick=()=>closeTempMenus();
  menu.addEventListener('click',e=>e.stopPropagation());
}

headerCornerImg.addEventListener('click', e => { e.stopPropagation(); sfx.open(); abrirVentanaAyudaEsquina(); });
