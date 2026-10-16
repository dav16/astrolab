import './style.css';
import { searchNasaImages } from './api/nasa.js';
import { translateToSpanish } from './api/translate.js';
import { readFavorites, storeFavorites } from './utils/storage.js';

const topics = [
  { label:'Galaxias', term:'galaxy', icon:'✦' },
  { label:'Nebulosas', term:'nebula', icon:'☄' },
  { label:'Planetas', term:'planet', icon:'◉' },
  { label:'Luna', term:'moon', icon:'☾' },
  { label:'Telescopios', term:'james webb telescope', icon:'⌕' },
  { label:'Astronautas', term:'astronaut', icon:'✧' }
];

const state = { items: [], favorites: readFavorites(), page: 1, total: 0, query:'galaxy', category:'Galaxias', view:'explore', loading:false, request:null };
const app = document.querySelector('#app');
app.innerHTML = `
<div class="shell">
  <aside class="sidebar">
    <a class="brand" href="#inicio" aria-label="AstroLab inicio"><span class="brand-mark">✳</span><span>ASTRO<span class="brand-light">LAB</span><small>SPACE DISCOVERY</small></span></a>
    <div class="nav-group"><div class="nav-caption">EXPLORAR</div>
      <button class="nav-link active" data-view="explore"><span>◈</span> Descubrir</button>
      <button class="nav-link" data-view="favorites"><span>♡</span> Mis favoritos <span class="favorite-count" id="favorite-count">0</span></button>
    </div>
    <div class="nav-group"><div class="nav-caption">COLECCIONES</div>
      <div id="topic-menu"></div>
    </div>
    <div class="sidebar-bottom"><span class="status-dot"></span> Conectado a NASA Images API <small>Información pública para exploración</small></div>
  </aside>
  <div class="content-wrap">
    <header class="topbar"><div class="breadcrumb">INICIO <span>/</span> <strong id="breadcrumb">DESCUBRIR</strong></div><div class="top-right"><span class="live-dot"></span> BIBLIOTECA ESPACIAL <span class="top-avatar">✦</span></div></header>
    <main id="inicio">
      <section class="hero"><div class="hero-stars"></div><div class="hero-body"><div class="eyebrow"><span class="orbit-icon">✧</span> TU VENTANA AL COSMOS <span class="eyebrow-line"></span> EDICIÓN 2026</div><h1>El universo está<br/>a un <em>clic de distancia.</em></h1><p>Explorá galaxias, nebulosas y los mayores descubrimientos del espacio a través del archivo multimedia de la NASA.</p><a class="hero-link" href="#coleccion">Empezar a explorar <span>↗</span></a></div><div class="hero-planet" aria-hidden="true"></div><div class="hero-orbit" aria-hidden="true"></div><div class="hero-coordinate">LAT 00° / COSMOS ∞</div></section>
      <section class="stats"><div class="stat"><span class="stat-icon">✧</span><div><strong>NASA</strong><small>Fuente de datos oficial</small></div></div><div class="stat"><span class="stat-icon">◈</span><div><strong>6 colecciones</strong><small>Temáticas para descubrir</small></div></div><div class="stat"><span class="stat-icon">♡</span><div><strong id="stat-favorites">0 guardados</strong><small>Tu archivo personal</small></div></div></section>
      <section class="discovery" id="coleccion"><div class="section-kicker">EXPLORACIÓN / ARCHIVO</div><div class="section-title-row"><div><h2 id="section-title">Descubrí el universo <span>✳</span></h2><p id="section-description">Fotografías reales, historias extraordinarias.</p></div><div class="api-label"><span class="live-dot"></span> DATOS EN VIVO</div></div>
        <div class="filters" id="topic-pills"></div>
        <form class="search-panel" id="search-form"><span aria-hidden="true">⌕</span><input id="search-input" type="search" placeholder="Buscá galaxias, planetas, misiones..." aria-label="Buscar imágenes en NASA" maxlength="100"/><button type="submit">Buscar <span>↗</span></button></form>
        <div class="results-head"><div><span id="results-label">Explorando galaxias</span><small id="results-count"></small></div><span class="results-meta">IMÁGENES DE NASA ↗</span></div>
        <div id="feedback" role="status" aria-live="polite"></div><div class="gallery" id="gallery"></div><div class="load-more-wrap"><button id="load-more" class="load-more" hidden>Cargar más descubrimientos ↓</button></div>
      </section>
    </main>
    <footer><span>✳ ASTROLAB</span><span>Proyecto educativo • Fuente: NASA Image and Video Library</span><a href="https://images.nasa.gov/" target="_blank" rel="noopener noreferrer">Visitar NASA ↗</a></footer>
  </div>
</div><dialog id="detail-dialog" class="detail-dialog" aria-label="Detalle del descubrimiento"><div id="detail-content"></div></dialog>`;

const $ = (selector) => document.querySelector(selector);
const gallery = $('#gallery');
const input = $('#search-input');
const dialog = $('#detail-dialog');
const safe = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const formatDate = date => date ? new Date(date).toLocaleDateString('es-NI', {year:'numeric',month:'long',day:'numeric'}) : 'Fecha no disponible';
const saved = id => state.favorites.some(x => x.id === id);
let detailRevision = 0;
let cardRevision = 0;

$('#topic-menu').innerHTML = topics.map(t=>`<button class="nav-link topic-side" data-term="${safe(t.term)}"><span>${t.icon}</span> ${t.label}</button>`).join('');
$('#topic-pills').innerHTML = topics.map(t=>`<button class="pill" data-term="${safe(t.term)}">${t.icon} ${t.label}</button>`).join('');

function setActive() {
  document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===state.view));
  document.querySelectorAll('[data-term]').forEach(el=>el.classList.toggle('active', state.view==='explore' && el.dataset.term===state.query));
  $('#breadcrumb').textContent = state.view==='favorites' ? 'MIS FAVORITOS' : 'DESCUBRIR';
  $('#section-title').innerHTML = state.view==='favorites' ? 'Tu colección <span>♡</span>' : 'Descubrí el universo <span>✳</span>';
  $('#section-description').textContent = state.view==='favorites' ? 'Tus imágenes preferidas, guardadas en este navegador.' : 'Fotografías reales, historias extraordinarias.';
  $('#topic-pills').hidden = state.view==='favorites';
  $('#search-form').hidden = state.view==='favorites';
  $('#load-more').hidden = state.view==='favorites' || state.loading || state.items.length>=state.total || state.items.length===0;
  $('#favorite-count').textContent = state.favorites.length;
  $('#stat-favorites').textContent = `${state.favorites.length} guardados`;
}

function card(item) {
  return `<article class="image-card"><button class="cover-button" data-detail="${safe(item.id)}" aria-label="Ver ${safe(item.title)}"><img loading="lazy" src="${safe(item.image)}" alt="${safe(item.title)}"/><span class="image-overlay"><span>VER DESCUBRIMIENTO ↗</span></span></button><div class="card-body"><div class="card-date">${safe(formatDate(item.date))}</div><div class="card-title-row"><button class="title-button" data-detail="${safe(item.id)}">${safe(item.title)}</button><button class="favorite-btn ${saved(item.id)?'is-favorite':''}" data-favorite="${safe(item.id)}" aria-label="${saved(item.id)?'Quitar de favoritos':'Agregar a favoritos'}" title="Favorito">${saved(item.id)?'♥':'♡'}</button></div><div class="card-origin">✧ ${safe(item.center)}</div></div></article>`;
}

async function translateCardTitles(items) {
  const revision = ++cardRevision;
  // Traducir los títulos sin bloquear la carga de imágenes ni la navegación.
  for (const item of items) {
    if (revision !== cardRevision) return;
    try {
      const spanish = await translateToSpanish(item.title);
      if (revision !== cardRevision) return;
      gallery.querySelectorAll('[data-detail]').forEach(button => {
        if (button.dataset.detail !== item.id) return;
        if (button.classList.contains('title-button')) button.textContent = spanish;
        button.setAttribute('aria-label', `Ver ${spanish}`);
      });
    } catch (error) {
      // Si falla la traducción, se conserva el título original de NASA.
      if (error.name === 'AbortError') return;
    }
  }
}

function render() {
  setActive();
  const items = state.view==='favorites' ? state.favorites : state.items;
  $('#results-label').textContent = state.view==='favorites' ? 'Tu archivo espacial' : (state.category ? `Explorando ${state.category.toLowerCase()}` : `Resultados: ${state.query}`);
  $('#results-count').textContent = state.view==='favorites' ? `${items.length} favoritos` : `${state.total.toLocaleString('es-NI')} resultados en NASA`;
  gallery.innerHTML = items.map(card).join('');
  translateCardTitles(items);
  if (!state.loading && !items.length) $('#feedback').innerHTML = `<div class="empty-state"><div>✧</div><h3>${state.view==='favorites'?'Aún no guardaste descubrimientos':'No encontramos resultados'}</h3><p>${state.view==='favorites'?'Explorá el catálogo y marcá ♡ en tus imágenes favoritas.':'Probá con otro término de búsqueda.'}</p></div>`;
  else if (!state.loading) $('#feedback').innerHTML = '';
}

async function load(reset=false) {
  if (state.view==='favorites') return;
  if (state.request) state.request.abort();
  const controller = new AbortController(); state.request = controller;
  state.loading = true;
  if (reset) { state.page=1; state.items=[]; state.total=0; gallery.innerHTML=''; }
  $('#feedback').innerHTML = '<div class="loading"><span class="spinner"></span> Consultando el archivo de la NASA...</div>';
  $('#load-more').hidden=true;
  try {
    const result = await searchNasaImages({query:state.query,page:state.page,signal:controller.signal});
    if (controller !== state.request) return;
    const ids = new Set(state.items.map(x=>x.id));
    state.items.push(...result.items.filter(x=>!ids.has(x.id)));
    state.total=result.total;
    state.loading=false;render();
  } catch(error) {
    if (error.name==='AbortError' || controller !== state.request) return;
    state.loading=false;
    $('#feedback').innerHTML = `<div class="error-state"><strong>No fue posible cargar las imágenes.</strong><p>${safe(error.message)}</p><button id="retry">Volver a intentar</button></div>`;
    $('#retry').addEventListener('click',()=>load(reset));
    setActive();
  }
}

function toggleFavorite(id) {
  const item = [...state.items,...state.favorites].find(x=>x.id===id);
  if (!item) return;
  state.favorites = saved(id) ? state.favorites.filter(x=>x.id!==id) : [item,...state.favorites];
  storeFavorites(state.favorites);render();
  if(dialog.open) showDetail(id);
}

async function showDetail(id) {
  const revision = ++detailRevision;
  const item = [...state.items,...state.favorites].find(x=>x.id===id);
  if (!item) return;
  const description = item.description.replace(/<[^>]*>/g,' ').trim();
  $('#detail-content').innerHTML = `<button class="close-detail" id="close-detail" aria-label="Cerrar">✕</button><img class="detail-image" src="${safe(item.image)}" alt="${safe(item.title)}"/><div class="detail-body"><span class="detail-eyebrow">NASA / EXPLORACIÓN ESPACIAL</span><h2 id="translated-detail-title">${safe(item.title)}</h2><div class="detail-meta"><span>◷ ${safe(formatDate(item.date))}</span><span>✧ ${safe(item.center)}</span></div><p id="translated-detail-description">${safe(description)}</p><div id="translation-state" class="translation-state" role="status">Traduciendo información al español…</div><div class="detail-actions"><button class="detail-save" data-favorite="${safe(item.id)}">${saved(item.id)?'♥ Quitar de favoritos':'♡ Guardar favorito'}</button><a href="${safe(item.url)}" target="_blank" rel="noopener noreferrer">Buscar en NASA ↗</a></div></div>`;
  $('#close-detail').addEventListener('click',()=>dialog.close());
  if(!dialog.open) dialog.showModal();
  const titleNode = $('#translated-detail-title');
  const descriptionNode = $('#translated-detail-description');
  const infoNode = $('#translation-state');
  const results = await Promise.allSettled([
    translateToSpanish(item.title),
    translateToSpanish(description)
  ]);
  if (revision !== detailRevision || !dialog.open || !titleNode.isConnected) return;
  if (results[0].status === 'fulfilled') titleNode.textContent = results[0].value;
  if (results[1].status === 'fulfilled') descriptionNode.textContent = results[1].value;
  const errors = results.filter(r => r.status === 'rejected').length;
  infoNode.textContent = errors ? 'Parte del contenido permanece en su idioma original porque el servicio de traducción no respondió.' : 'Traducción automática al español · Fuente original: NASA';
}

document.addEventListener('click',(e)=>{
  const favorite=e.target.closest('[data-favorite]'); if(favorite) {toggleFavorite(favorite.dataset.favorite);return;}
  const detail=e.target.closest('[data-detail]'); if(detail) {showDetail(detail.dataset.detail);return;}
  const topic=e.target.closest('[data-term]'); if(topic) {state.view='explore'; state.query=topic.dataset.term;state.category=topics.find(t=>t.term===state.query)?.label??'';input.value='';setActive();load(true);return;}
  const view=e.target.closest('[data-view]'); if(view) {state.view=view.dataset.view;state.loading=false;if(state.request)state.request.abort();render();if(state.view==='explore'&&!state.items.length)load(true);return;}
});
$('#search-form').addEventListener('submit',(e)=>{e.preventDefault();const q=input.value.trim();if(!q)return;state.query=q;state.category='';state.view='explore';setActive();load(true);});
$('#load-more').addEventListener('click',()=>{state.page+=1;load();});
dialog.addEventListener('click',(e)=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener('close', () => { detailRevision++; });
render();load(true);
