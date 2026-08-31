'use strict';
let RECIPES = [], HISTORY = { weeks: [] };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s || '').replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mins = (pt) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(pt || ''); return m ? ((+m[1] || 0) * 60 + (+m[2] || 0)) : 0; };
function unique(k) { return [...new Set(RECIPES.map((r) => r[k]).filter(Boolean))].sort(); }
function fill(id, k) { const e = $(id); unique(k).forEach((v) => e.insertAdjacentHTML('beforeend', `<option value="${esc(v)}">${esc(v)}</option>`)); }
function ratingFor(r) { return window.FFMCloud?.getRating(r.id) ?? Number(localStorage.getItem(`ffm-rating-${r.id}`) || 0); }
function mealStatus(e) { const id=e.recipeId||e.eventId; return window.FFMCloud?.getStatus(e.date,id) ?? localStorage.getItem(`ffm-meal-status-${e.date}-${id}`) ?? 'planned'; }
function cookedDates(r) {
  const dates = [];
  HISTORY.weeks.forEach((w) => w.entries.forEach((e) => { if (e.recipeId === r.id && mealStatus(e) === 'cooked') dates.push(e.date); }));
  return dates.sort();
}
function cookedCount(r) { return cookedDates(r).length; }
function lastCookedMs(r) { const d = cookedDates(r).at(-1); return d ? Date.parse(`${d}T12:00:00`) : 0; }
function recipeCard(r) {
  const made = cookedDates(r);
  const last = made.length ? new Date(`${made.at(-1)}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not yet logged';
  return `<a class="libraryRecipe" href="recipes/${encodeURIComponent(r.id)}.html"><img src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy"><div class="libraryRecipeBody"><div class="tagline"><span>${esc(r.cuisine)}</span><span>${esc(r.type)}</span></div><h2>${esc(r.title)}</h2><p class="sub clamp">${esc(r.description)}</p><div class="recipeStats"><span>Prep ${mins(r.prepTime)} min</span><span>Cook ${mins(r.cookTime)} min</span><span>⏱ ${mins(r.totalTime)} min total</span><span>~${r.caloriesPerServing || '?'} cal</span><span class="ratingBadge">${ratingFor(r) ? '★'.repeat(ratingFor(r)) + '☆'.repeat(5 - ratingFor(r)) : 'Unrated'}</span><span>Made ${made.length}×</span><span>Last: ${last}</span></div></div></a>`;
}
function renderRecipes() {
  const qv = $('#recipeSearch').value.trim().toLowerCase();
  const cf = $('#cuisineFilter').value, pf = $('#proteinFilter').value, tf = $('#typeFilter').value, sf = $('#sourceFilter').value;
  const rf = $('#ratingFilter').value, kf = $('#cookedFilter').value, tm = $('#timeFilter').value, cm = $('#cookTimeFilter').value, calf = $('#calorieFilter').value;
  const sort = $('#sortFilter')?.value || 'recommended';
  let rr = RECIPES.filter((r) => {
    const hay = [r.title, r.description, r.cuisine, r.protein, r.type, r.sourceName, ...(r.tags || []), ...(r.ingredients || []), `prep ${mins(r.prepTime)} min`, `cook ${mins(r.cookTime)} min`, `total ${mins(r.totalTime)} min`, `calories ${r.caloriesPerServing || ''}`, `${r.caloriesPerServing || ''} cal`].join(' ').toLowerCase();
    const rating = ratingFor(r), ratingOK = !rf || (rf === 'unrated' ? rating === 0 : rating >= Number(rf));
    const made = cookedCount(r), cookedOK = !kf || (kf === 'cooked' ? made > 0 : made === 0);
    return (!qv || hay.includes(qv)) && (!cf || r.cuisine === cf) && (!pf || r.protein === pf) && (!tf || r.type === tf) && (!sf || r.sourceName === sf) && ratingOK && cookedOK && (!tm || mins(r.totalTime) <= Number(tm)) && (!cm || mins(r.cookTime) <= Number(cm)) && (!calf || (r.caloriesPerServing || Infinity) <= Number(calf));
  });
  const sorters = {
    rating: (a, b) => ratingFor(b) - ratingFor(a) || a.title.localeCompare(b.title),
    quickest: (a, b) => mins(a.totalTime) - mins(b.totalTime) || a.title.localeCompare(b.title),
    calories: (a, b) => (a.caloriesPerServing || Infinity) - (b.caloriesPerServing || Infinity),
    mostCooked: (a, b) => cookedCount(b) - cookedCount(a) || a.title.localeCompare(b.title),
    leastRecent: (a, b) => lastCookedMs(a) - lastCookedMs(b) || a.title.localeCompare(b.title),
    az: (a, b) => a.title.localeCompare(b.title)
  };
  if (sorters[sort]) rr.sort(sorters[sort]);
  $('#recipeGrid').innerHTML = rr.map(recipeCard).join('');
  $('#resultCount').textContent = `${rr.length} recipe${rr.length === 1 ? '' : 's'}`;
  $('#noRecipes').hidden = !!rr.length;
}
function statusLabel(e) {
  const s = mealStatus(e);
  if (e.entryType === 'dinnerDate') return s === 'went' ? '✓ Went' : s === 'skipped' ? '⊘ Skipped' : '○ Planned';
  return s === 'cooked' ? '✓ Cooked' : s === 'skipped' ? '⊘ Skipped' : '○ Planned';
}
function eventMeta(e) {
  const parts = [];
  if (e.restaurant) parts.push(e.restaurant);
  if (e.rating) parts.push(`★ ${e.rating}${e.ratingSource ? ` ${e.ratingSource}` : ''}`);
  if (e.price) parts.push(e.price);
  if (e.city) parts.push(e.city);
  return parts.join(' · ') || 'Eating out';
}
function weekHtml(w) {
  return `<section class="historyWeek card"><div class="weekHeading"><div><div class="day">Week of ${new Date(`${w.weekStart}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div><h2>${esc(w.label)}</h2></div></div><div class="historyList">${w.entries.map((e) => {
    const event = e.entryType === 'dinnerDate', r = event ? null : RECIPES.find((x) => x.id === e.recipeId);
    const media = event ? '<div class="historyDateIcon">♥</div>' : (r ? `<img src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">` : '');
    const inner = `<div class="historyDate"><strong>${esc(e.day.slice(0, 3))}</strong><span>${new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>${media}<div><strong>${esc(event ? (e.restaurant || e.title) : e.title)}</strong><div class="sub">${event ? esc(eventMeta(e)) : (r ? `${esc(r.cuisine)} · ${esc(r.type)}` : '')}</div><span class="historyStatus ${mealStatus(e)}">${statusLabel(e)}</span></div>${event ? '' : '<span class="chev">›</span>'}`;
    return event ? `<div class="historyRow historyEvent">${inner}</div>` : `<a href="recipes/${encodeURIComponent(e.recipeId)}.html" class="historyRow">${inner}</a>`;
  }).join('')}</div></section>`;
}
function renderHistory() {
  const d = $('#historyDate').value;
  if (d) {
    let hit = null;
    HISTORY.weeks.forEach((w) => w.entries.forEach((e) => { if (e.date === d) hit = e; }));
    if (hit) {
      const event = hit.entryType === 'dinnerDate';
      $('#dateResult').innerHTML = event ? `<div class="dateHit"><div class="day">${new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div><h2>♥ ${esc(hit.restaurant || hit.title)}</h2><p>${esc(eventMeta(hit))}</p><p><span class="historyStatus ${mealStatus(hit)}">${statusLabel(hit)}</span></p></div>` : `<a class="dateHit" href="recipes/${encodeURIComponent(hit.recipeId)}.html"><div class="day">${new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div><h2>${esc(hit.title)}</h2><p><span class="historyStatus ${mealStatus(hit)}">${statusLabel(hit)}</span> &nbsp; Open recipe <span>›</span></p></a>`;
    } else $('#dateResult').innerHTML = '<div class="dateEmpty">No dinner has been saved for that date yet.</div>';
  } else $('#dateResult').innerHTML = '';
  $('#historyWeeks').innerHTML = HISTORY.weeks.slice().reverse().map(weekHtml).join('');
}

document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active')); b.classList.add('active');
  const h = b.dataset.tab === 'history'; $('#browsePanel').hidden = h; $('#historyPanel').hidden = !h; if (h) renderHistory();
}));
['#recipeSearch', '#cuisineFilter', '#proteinFilter', '#typeFilter', '#sourceFilter', '#ratingFilter', '#cookedFilter', '#timeFilter', '#cookTimeFilter', '#calorieFilter', '#sortFilter'].forEach((id) => {
  const el = $(id); if (el) el.addEventListener(id === '#recipeSearch' ? 'input' : 'change', renderRecipes);
});
$('#clearFilters').addEventListener('click', () => {
  $('#recipeSearch').value = '';
  ['#cuisineFilter', '#proteinFilter', '#typeFilter', '#sourceFilter', '#ratingFilter', '#cookedFilter', '#timeFilter', '#cookTimeFilter', '#calorieFilter'].forEach((x) => { $(x).value = ''; });
  if ($('#sortFilter')) $('#sortFilter').value = 'recommended';
  renderRecipes();
});
$('#historyDate').addEventListener('change', renderHistory);
$('#clearDate').addEventListener('click', () => { $('#historyDate').value = ''; renderHistory(); });
Promise.all([
  fetch('data/recipes.json?v=12.2', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('recipes'); return r.json(); }),
  fetch('data/history.json?v=12.2', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('history'); return r.json(); })
]).then(([r, h]) => {
  RECIPES = r.recipes || []; HISTORY = h || { weeks: [] };
  fill('#cuisineFilter', 'cuisine'); fill('#proteinFilter', 'protein'); fill('#typeFilter', 'type'); fill('#sourceFilter', 'sourceName');
  renderRecipes(); renderHistory();
}).catch(() => { $('#recipeGrid').innerHTML = '<div class="card errorCard">Unable to load the recipe library. Refresh after GitHub Pages finishes deploying.</div>'; });
window.addEventListener('pageshow', () => { if (RECIPES.length) { renderRecipes(); renderHistory(); } });
window.addEventListener('focus', () => { if (RECIPES.length) { renderRecipes(); renderHistory(); } });

window.addEventListener('ffm-cloud-change', () => { if (RECIPES.length) { renderRecipes(); renderHistory(); } });
