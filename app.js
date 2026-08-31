'use strict';

const FFM = {
  timerKey: 'ffm-kitchen-timer-v11',
  ratingPrefix: 'ffm-rating-',
  mealStatusPrefix: 'ffm-meal-status-'
};

let currentStep = 0;
let timerHandle = null;
let timerExpanded = false;
let lastModalFocus = null;
const q = (s) => document.querySelector(s);
const steps = window.RECIPE?.steps || [];

function recipeKey() {
  return FFM.ratingPrefix + (window.RECIPE?.id || window.RECIPE?.title || location.pathname);
}
function getRating() { return window.FFMCloud?.getRating(window.RECIPE?.id) ?? Number(localStorage.getItem(recipeKey()) || 0); }
async function setRating(n) { if (window.FFMCloud) await window.FFMCloud.setRating(window.RECIPE?.id, n); else localStorage.setItem(recipeKey(), String(n)); renderRating(n); }
function renderRating(n = getRating()) {
  document.querySelectorAll('.ratingStar').forEach((b, i) => {
    b.classList.toggle('on', i < n);
    b.setAttribute('aria-pressed', i < n ? 'true' : 'false');
  });
  const t = q('#ratingText');
  if (t) t.textContent = n ? `${n} of 5 stars` : 'Tap to rate';
}

function clampScrollPosition() {
  // iOS Safari can retain a stale scroll offset after a large section is hidden,
  // leaving a viewport-sized blank area below the real document. Clamp only
  // after layout-changing recipe actions so normal scrolling is unaffected.
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (window.scrollY > maxY) window.scrollTo(0, maxY);
}
function afterRecipeLayout(callback) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    clampScrollPosition();
    if (callback) callback();
  }));
}
function setRecipeMode(mode, shouldScroll = true) {
  const cook = q('#cook'), all = q('#allsteps');
  if (!cook || !all) return;
  const cooking = mode === 'cook';
  cook.classList.toggle('active', cooking);
  all.classList.toggle('show', !cooking);
  if (cooking) updateStep();
  document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  const target = cooking ? cook : all;
  afterRecipeLayout(() => {
    if (shouldScroll) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
function startCooking() { setRecipeMode('cook', true); }
function showAll() { setRecipeMode('all', true); }
function moveStep(delta) {
  if (delta > 0 && currentStep === steps.length - 1) { finishCooking(); return; }
  currentStep = Math.max(0, Math.min(steps.length - 1, currentStep + delta));
  updateStep();
}
function updateStep() {
  if (!q('#stepText') || !steps.length) return;
  q('#stepNum').textContent = `Step ${currentStep + 1} of ${steps.length}`;
  q('#bar').style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  q('#stepText').textContent = steps[currentStep];
  const si = q('#stepImage');
  if (si) {
    const imgs = window.RECIPE?.stepImages || [];
    si.src = imgs[currentStep] || window.RECIPE?.image || '';
    si.alt = `Step ${currentStep + 1}: ${steps[currentStep]}`;
    si.closest('.stepMedia')?.classList.toggle('hidden', !si.src);
  }
  q('#prev').disabled = currentStep === 0;
  q('#next').textContent = currentStep === steps.length - 1 ? 'Done ✓' : 'Next';
  afterRecipeLayout();
}
function finishCooking() {
  celebrate();
  q('#cook')?.classList.remove('active');
  currentStep = 0;
  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 300);
  // Weekday pages carry date/day metadata. Permanent library pages intentionally do not.
  if (window.RECIPE?.date && window.RECIPE?.id) {
    setTimeout(() => showCookedPrompt(), 650);
  }
}
function showCookedPrompt() {
  let modal = q('#cookedModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cookedModal';
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cookedModalTitle');
    modal.innerHTML = `<div class="modalbox"><div class="day">Dinner complete</div><h2 id="cookedModalTitle">Mark this meal as cooked?</h2><p>This keeps your actual dinner history accurate. You can always change it later on This Week.</p><div class="btns"><button class="btn" id="markCookedBtn">✓ Mark Cooked</button><button class="btn alt" id="notNowBtn">Not now</button></div></div>`;
    document.body.appendChild(modal);
    q('#markCookedBtn').addEventListener('click', async () => {
      if (window.FFMCloud) await window.FFMCloud.setStatus(window.RECIPE.date, window.RECIPE.id, 'cooked', 'recipe');
      else localStorage.setItem(`${FFM.mealStatusPrefix}${window.RECIPE.date}-${window.RECIPE.id}`, 'cooked');
      closeDialog(modal);
    });
    q('#notNowBtn').addEventListener('click', () => closeDialog(modal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeDialog(modal); });
  }
  openDialog(modal);
}
function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confettiLayer';
  document.body.appendChild(layer);
  const colors = ['#26382c', '#e0a458', '#d96c4a', '#6e9f75', '#f2d06b', '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.35}s`;
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(c);
  }
  setTimeout(() => layer.remove(), 2200);
}

function readTimer() {
  try {
    return JSON.parse(localStorage.getItem(FFM.timerKey)) || { initial: 0, remaining: 0, endAt: null, running: false };
  } catch (_) {
    return { initial: 0, remaining: 0, endAt: null, running: false };
  }
}
function writeTimer(state) { localStorage.setItem(FFM.timerKey, JSON.stringify(state)); }
function normalizeTimer(state) {
  if (state.running && state.endAt) state.remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
  if (state.remaining <= 0) return { ...state, remaining: 0, endAt: null, running: false };
  return state;
}
function timerState() {
  const s = normalizeTimer(readTimer());
  writeTimer(s);
  return s;
}
function startTimer(minutes) {
  const seconds = minutes * 60;
  writeTimer({ initial: seconds, remaining: seconds, endAt: Date.now() + seconds * 1000, running: true });
  ensureTimerLoop(); renderTimer();
}
function togglePause() {
  let s = timerState();
  if (s.remaining <= 0) return;
  if (s.running) s = { ...s, remaining: Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000)), endAt: null, running: false };
  else s = { ...s, endAt: Date.now() + s.remaining * 1000, running: true };
  writeTimer(s); ensureTimerLoop(); renderTimer();
}
function stopTimer() { writeTimer({ initial: 0, remaining: 0, endAt: null, running: false }); stopTimerLoop(); renderTimer(); }
function resetTimer() {
  const s = timerState();
  writeTimer({ initial: s.initial, remaining: s.initial, endAt: null, running: false });
  stopTimerLoop(); renderTimer();
}
function ensureTimerLoop() {
  if (timerHandle) return;
  timerHandle = setInterval(() => {
    const before = readTimer();
    const s = timerState();
    renderTimer();
    if (before.running && !s.running && s.remaining === 0) timerFinished();
    if (!s.running) stopTimerLoop();
  }, 500);
}
function stopTimerLoop() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; }
function timerFinished() {
  navigator.vibrate?.([200, 100, 200]);
  const live = q('#timerLive');
  if (live) live.textContent = 'Kitchen timer finished';
}
function timeText(seconds) {
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
function renderTimer() {
  const s = timerState();
  const c = q('#clock'), mini = q('#miniClock');
  if (c) c.textContent = timeText(s.remaining);
  if (mini) mini.textContent = s.remaining ? timeText(s.remaining) : 'Timer';
  const p = q('#pauseBtn');
  if (p) { p.textContent = s.running ? 'Pause' : 'Resume'; p.disabled = s.remaining <= 0; }
  q('#floatingTimer')?.classList.toggle('running', s.remaining > 0);
}
function toggleTimer(expand) {
  timerExpanded = typeof expand === 'boolean' ? expand : !timerExpanded;
  q('#floatingTimer')?.classList.toggle('expanded', timerExpanded);
}

function openDialog(el) {
  if (!el) return;
  lastModalFocus = document.activeElement;
  el.classList.add('show');
  document.body.classList.add('modalOpen');
  requestAnimationFrame(() => el.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])')?.focus());
}
function closeDialog(el) {
  if (!el) return;
  el.classList.remove('show');
  document.body.classList.remove('modalOpen');
  lastModalFocus?.focus?.();
}
function openAnyList() { openDialog(q('#anyModal')); }
function closeAnyList() { closeDialog(q('#anyModal')); }
async function shareRecipe() {
  try {
    if (navigator.share) await navigator.share({ title: window.RECIPE.title, text: 'Save this recipe to AnyList', url: location.href });
    else alert('In Safari, tap Share, then choose AnyList Recipe Import.');
  } catch (_) { /* user cancelled */ }
}
function initModalAccessibility() {
  q('#anyModal')?.setAttribute('role', 'dialog');
  q('#anyModal')?.setAttribute('aria-modal', 'true');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (q('#cookedModal')?.classList.contains('show')) closeDialog(q('#cookedModal'));
      else if (q('#anyModal')?.classList.contains('show')) closeAnyList();
      else if (q('#floatingTimer')?.classList.contains('expanded')) toggleTimer(false);
    }
  });
}
function initRecipeModeDock() {
  const heroBtns = document.querySelector('.hero .btns');
  if (!heroBtns || !q('#cook') || !q('#allsteps')) return;
  document.body.classList.add('recipePage');
  const dock = document.createElement('div');
  dock.className = 'recipeModeDock';
  dock.innerHTML = '<div class="recipeModeDockInner" role="group" aria-label="Recipe view"><button class="modeBtn" data-mode="all" type="button">All Steps</button><button class="modeBtn" data-mode="cook" type="button">Cooking Mode</button></div>';
  heroBtns.closest('.hero').insertAdjacentElement('afterend', dock);
  dock.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setRecipeMode(b.dataset.mode, true); });
  const io = new IntersectionObserver((entries) => dock.classList.toggle('visible', !entries[0].isIntersecting), { threshold: 0.05 });
  io.observe(heroBtns);
}
function initTimerAccessibility() {
  const ft = q('#floatingTimer');
  if (!ft) return;
  const live = document.createElement('div');
  live.id = 'timerLive'; live.className = 'srOnly'; live.setAttribute('aria-live', 'polite');
  ft.appendChild(live);
  if (timerState().running) ensureTimerLoop();
  window.addEventListener('focus', renderTimer);
  document.addEventListener('visibilitychange', () => { renderTimer(); if (!document.hidden && timerState().running) ensureTimerLoop(); });
}

updateStep();
renderTimer();
renderRating();
initRecipeModeDock();
initModalAccessibility();
initTimerAccessibility();

window.addEventListener('ffm-cloud-change', () => renderRating());

/* v12.5 diagnostic: mobile layout inspector */
(function initMobileLayoutDiagnostic(){
  if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  const panel=document.createElement('details');
  panel.id='ffmLayoutDebug';
  panel.innerHTML='<summary>Layout debug</summary><pre id="ffmDebugText"></pre><button type="button" id="ffmCopyDebug">Copy report</button>';
  document.body.appendChild(panel);
  const selectors=['html','body','.wrap','.recipeModeDock','#allsteps','#cook','#cook .controls','#floatingTimer'];
  function report(){
    const vv=window.visualViewport;
    const lines=[
      'FFM v12.5 diagnostic',
      `inner=${innerWidth}x${innerHeight}`,
      `visual=${vv?Math.round(vv.width)+'x'+Math.round(vv.height):'n/a'} offsetTop=${vv?Math.round(vv.offsetTop):'n/a'}`,
      `scrollY=${Math.round(scrollY)} docScrollH=${document.documentElement.scrollHeight} bodyScrollH=${document.body.scrollHeight}`,
      `docClientH=${document.documentElement.clientHeight}`
    ];
    selectors.forEach(sel=>{
      const el=document.querySelector(sel); if(!el){lines.push(`${sel}: missing`);return;}
      const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
      lines.push(`${sel}: top=${Math.round(r.top+scrollY)} bottom=${Math.round(r.bottom+scrollY)} h=${Math.round(r.height)} display=${cs.display} pos=${cs.position} minH=${cs.minHeight} padB=${cs.paddingBottom} marginB=${cs.marginBottom}`);
    });
    const last=[...document.body.children].filter(el=>getComputedStyle(el).position!=='fixed').at(-1);
    if(last){const r=last.getBoundingClientRect();lines.push(`lastBodyChild=${last.tagName}.${last.className||''} bottom=${Math.round(r.bottom+scrollY)} h=${Math.round(r.height)}`)}
    document.querySelector('#ffmDebugText').textContent=lines.join('\n');
  }
  panel.addEventListener('toggle',()=>{if(panel.open) report()});
  document.querySelector('#ffmCopyDebug').addEventListener('click',async()=>{report();try{await navigator.clipboard.writeText(document.querySelector('#ffmDebugText').textContent)}catch(e){}});
  window.addEventListener('resize',()=>panel.open&&report());
  window.addEventListener('scroll',()=>panel.open&&report(),{passive:true});
})();
