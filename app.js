let currentStep=0,timerHandle=null,timerRemaining=0,timerInitial=0,timerRunning=false,timerExpanded=false;const q=s=>document.querySelector(s);const steps=window.RECIPE?.steps||[];
function recipeKey(){return 'ffm-rating-'+(window.RECIPE?.id||window.RECIPE?.title||location.pathname)}
function getRating(){return Number(localStorage.getItem(recipeKey())||0)}
function setRating(n){localStorage.setItem(recipeKey(),String(n));renderRating(n)}
function renderRating(n=getRating()){document.querySelectorAll('.ratingStar').forEach((b,i)=>{b.classList.toggle('on',i<n);b.setAttribute('aria-pressed',i<n?'true':'false')});let t=q('#ratingText');if(t)t.textContent=n?`${n} of 5 stars`:'Tap to rate'}
function startCooking(){q('#cook').classList.add('active');q('#allsteps').classList.remove('show');updateStep();q('#cook').scrollIntoView({behavior:'smooth'})}
function moveStep(d){if(d>0&&currentStep===steps.length-1){finishCooking();return}currentStep=Math.max(0,Math.min(steps.length-1,currentStep+d));updateStep()}
function updateStep(){if(!q('#stepText'))return;q('#stepNum').textContent=`Step ${currentStep+1} of ${steps.length}`;q('#bar').style.width=`${(currentStep+1)/steps.length*100}%`;q('#stepText').textContent=steps[currentStep];const si=q('#stepImage');if(si){const imgs=window.RECIPE?.stepImages||[];si.src=imgs[currentStep]||window.RECIPE?.image||'';si.alt=`Step ${currentStep+1}: ${steps[currentStep]}`;si.closest('.stepMedia')?.classList.toggle('hidden',!si.src)}q('#prev').disabled=currentStep===0;q('#next').textContent=currentStep===steps.length-1?'Done ✓':'Next'}
function showAll(){q('#allsteps').classList.toggle('show');q('#allsteps').scrollIntoView({behavior:'smooth'})}
function finishCooking(){celebrate();q('#cook')?.classList.remove('active');currentStep=0;setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),350)}
function celebrate(){const layer=document.createElement('div');layer.className='confettiLayer';document.body.appendChild(layer);const colors=['#26382c','#e0a458','#d96c4a','#6e9f75','#f2d06b','#ffffff'];for(let i=0;i<70;i++){let c=document.createElement('i');c.style.left=(Math.random()*100)+'vw';c.style.background=colors[i%colors.length];c.style.animationDelay=(Math.random()*.35)+'s';c.style.transform=`rotate(${Math.random()*360}deg)`;layer.appendChild(c)}setTimeout(()=>layer.remove(),2200)}
function startTimer(m){clearInterval(timerHandle);timerInitial=m*60;timerRemaining=timerInitial;timerRunning=true;renderTimer();timerHandle=setInterval(tick,1000)}
function tick(){if(!timerRunning)return;timerRemaining=Math.max(0,timerRemaining-1);renderTimer();if(!timerRemaining){clearInterval(timerHandle);timerRunning=false;renderTimer();navigator.vibrate?.([200,100,200])}}
function timeText(){let m=Math.floor(timerRemaining/60),s=timerRemaining%60;return `${m}:${String(s).padStart(2,'0')}`}
function renderTimer(){let c=q('#clock'),mini=q('#miniClock');if(c)c.textContent=timeText();if(mini)mini.textContent=timerRemaining?timeText():'Timer';let p=q('#pauseBtn');if(p)p.textContent=timerRunning?'Pause':'Resume';q('#floatingTimer')?.classList.toggle('running',timerRemaining>0)}
function togglePause(){if(timerRemaining<=0)return;timerRunning=!timerRunning;renderTimer()}
function stopTimer(){clearInterval(timerHandle);timerRunning=false;timerRemaining=timerInitial=0;renderTimer()}
function resetTimer(){clearInterval(timerHandle);timerRunning=false;timerRemaining=timerInitial;renderTimer()}
function toggleTimer(expand){timerExpanded=typeof expand==='boolean'?expand:!timerExpanded;q('#floatingTimer')?.classList.toggle('expanded',timerExpanded)}
function openAnyList(){q('#anyModal').classList.add('show')}function closeAnyList(){q('#anyModal').classList.remove('show')}
async function shareRecipe(){try{if(navigator.share)await navigator.share({title:window.RECIPE.title,text:'Save this recipe to AnyList',url:location.href});else alert('In Safari, tap Share, then choose AnyList Recipe Import.')}catch(e){}}
updateStep();renderTimer();renderRating();
// v9: sticky in-page mode switcher and mobile-safe floating controls
function setRecipeMode(mode, shouldScroll=true){
  const cook=q('#cook'), all=q('#allsteps');
  if(!cook||!all)return;
  if(mode==='cook'){
    cook.classList.add('active'); all.classList.remove('show'); updateStep();
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='cook'));
    if(shouldScroll)cook.scrollIntoView({behavior:'smooth',block:'start'});
  }else{
    cook.classList.remove('active'); all.classList.add('show');
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode==='all'));
    if(shouldScroll)all.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
startCooking=function(){setRecipeMode('cook',true)};
showAll=function(){setRecipeMode('all',true)};
function initRecipeModeDock(){
  const heroBtns=document.querySelector('.hero .btns');
  const main=document.querySelector('main.wrap');
  if(!heroBtns||!main||!q('#cook')||!q('#allsteps'))return;
  document.body.classList.add('recipePage');
  const dock=document.createElement('div');
  dock.className='recipeModeDock';
  dock.innerHTML='<div class="recipeModeDockInner" role="group" aria-label="Recipe view"><button class="modeBtn" data-mode="all" type="button">All Steps</button><button class="modeBtn" data-mode="cook" type="button">Cooking Mode</button></div>';
  heroBtns.closest('.hero').insertAdjacentElement('afterend',dock);
  dock.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)setRecipeMode(b.dataset.mode,true)});
  const io=new IntersectionObserver(entries=>{const visible=!entries[0].isIntersecting;dock.classList.toggle('visible',visible)},{threshold:.05});
  io.observe(heroBtns);
}
initRecipeModeDock();
