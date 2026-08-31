'use strict';
(() => {
  function paint(card) {
    const status = window.FFMCloud?.getStatus(card.dataset.date, card.dataset.recipe) || 'planned';
    card.dataset.status = status;
    card.querySelectorAll('.statusBtn').forEach((b) => { const selected=b.dataset.status===status;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected?'true':'false'); });
  }
  function bind(){document.querySelectorAll('.mealTrack').forEach((card)=>{paint(card);card.querySelectorAll('.statusBtn').forEach((b)=>b.addEventListener('click',async()=>{b.disabled=true;const ok=await window.FFMCloud.setStatus(card.dataset.date,card.dataset.recipe,b.dataset.status,card.dataset.mealType==='dinnerDate'?'dinner_date':'recipe');b.disabled=false;if(ok)paint(card)}));});}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind):bind();
  window.addEventListener('ffm-cloud-change',()=>document.querySelectorAll('.mealTrack').forEach(paint));
  window.addEventListener('pageshow',()=>document.querySelectorAll('.mealTrack').forEach(paint));
})();
