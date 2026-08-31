'use strict';
(() => {
  const prefix = 'ffm-meal-status-';
  const key = (date, id) => `${prefix}${date}-${id}`;
  function paint(card) {
    const status = localStorage.getItem(key(card.dataset.date, card.dataset.recipe)) || 'planned';
    card.dataset.status = status;
    card.querySelectorAll('.statusBtn').forEach((b) => {
      const selected = b.dataset.status === status;
      b.classList.toggle('selected', selected);
      b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.mealTrack').forEach((card) => {
    paint(card);
    card.querySelectorAll('.statusBtn').forEach((b) => b.addEventListener('click', () => {
      const storageKey = key(card.dataset.date, card.dataset.recipe);
      if (b.dataset.status === 'planned') localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, b.dataset.status);
      paint(card);
    }));
  });
  window.addEventListener('pageshow', () => document.querySelectorAll('.mealTrack').forEach(paint));
})();
