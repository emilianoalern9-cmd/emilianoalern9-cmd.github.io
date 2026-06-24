/* ═══════════════════════════════════════════════════════════
   config.js — Constantes, categorías, opciones de la app
   ═══════════════════════════════════════════════════════════ */

'use strict';

const STORAGE_VERSION = 13;

const CATEGORIAS = {
  morfologia: {
    options: ["Humano","Humanoide","Mamífero","Híbrido","Ave","Reptil","Pez","Insecto","Amorfo","Etéreo","Artificial","Otro"],
    icons: {
      "Humano":"🧑","Humanoide":"🧝","Mamífero":"🦌","Híbrido":"🦄","Ave":"🕊️",
      "Reptil":"🐍","Pez":"🐟","Insecto":"🐞","Amorfo":"🌀","Etéreo":"✨","Artificial":"🤖","Otro":"❓"
    },
    btn: "🔮",
    titulo: "Morfología"
  },
  tipo: {
    options: ["Mitológico","Criptido","Difuso"],
    icons: { "Mitológico":"🏛️","Criptido":"🐾","Difuso":"🌫️" },
    btn: "🌙",
    titulo: "Tipo de ser"
  },
  elemento: {
    options: ["Aéreo","Acuático","Terrestre","Subterráneo","Anfibio","Misceláneo"],
    icons: { "Aéreo":"💨","Acuático":"💧","Terrestre":"🌿","Subterráneo":"⛰️","Anfibio":"🐸","Misceláneo":"⚙️" },
    btn: "💧",
    titulo: "Elemento"
  },
  avistamiento: {
    options: ["Grabado / Capturado","Documentado","Crónicas","Avistamiento","Ficción","Tradición oral","Difuso"],
    icons: {
      "Grabado / Capturado":"📹","Documentado":"📜","Crónicas":"📖",
      "Avistamiento":"👁️","Ficción":"📚","Tradición oral":"🗣️","Difuso":"❓"
    },
    btn: "👁️",
    titulo: "Avistamiento"
  }
};

const ORDEN_OPCIONES = [
  { v: "nombre_asc",       l: "Alfabético A→Z" },
  { v: "nombre_desc",      l: "Alfabético Z→A" },
  { v: "morfologia_asc",   l: "Morfología A→Z" },
  { v: "morfologia_desc",  l: "Morfología Z→A" },
  { v: "tipo_asc",         l: "Tipo A→Z" },
  { v: "tipo_desc",        l: "Tipo Z→A" },
  { v: "elemento_asc",     l: "Elemento A→Z" },
  { v: "elemento_desc",    l: "Elemento Z→A" },
  { v: "avistamiento_asc", l: "Avistamiento A→Z" },
  { v: "avistamiento_desc",l: "Avistamiento Z→A" }
];

const CSV_CAMPOS = ["id","nombre","morfologia","tipo","elemento","avistamiento","ubicacion","epoca","subcategorias","descripcion","links"];

/* Mapa de foco → object-position (cuadrícula 5×5, 25 posiciones)
   Col:   0%    25%    50%    75%   100%
   F.0%:   1      2      3      4      5
   F.25%:  6      7      8      9     10
   F.50%: 11     12     13     14     15
   F.75%: 16     17     18     19     20
   F.100%:21     22     23     24     25
   Default: 13 (centro exacto) */
const FOCO_POSITION = {
   1:"0% 0%",   2:"25% 0%",   3:"50% 0%",   4:"75% 0%",   5:"100% 0%",
   6:"0% 25%",  7:"25% 25%",  8:"50% 25%",  9:"75% 25%", 10:"100% 25%",
  11:"0% 50%", 12:"25% 50%", 13:"50% 50%", 14:"75% 50%", 15:"100% 50%",
  16:"0% 75%", 17:"25% 75%", 18:"50% 75%", 19:"75% 75%", 20:"100% 75%",
  21:"0% 100%",22:"25% 100%",23:"50% 100%",24:"75% 100%",25:"100% 100%"
};

function focoToObjectPosition(foco) {
  return FOCO_POSITION[parseInt(foco, 10)] || FOCO_POSITION[13];
}

const getIcon = (cat, val) => CATEGORIAS[cat]?.icons[val] || '❓';
