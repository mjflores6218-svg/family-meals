let currentStep=0,cooking=false,timerHandle=null,timerEnd=0;const steps=window.RECIPE.steps;
function q(s){return document.querySelector(s)}
function startCooking(){cooking=true;q('#cook').classList.add('active');updateStep();q('#cook').scrollIntoView({behavior:'smooth',block:'start'})}
function moveStep(delta){if(delta>0&&currentStep===steps.length-1){q('#finishText').textContent='Dinner is ready — enjoy!';return}currentStep=Math.max(0,Math.min(steps.length-1,currentStep+delta));updateStep()}
function updateStep(){q('#stepNum').textContent=`Step ${currentStep+1} of ${steps.length}`;q('#bar').style.width=`${(currentStep+1)/steps.length*100}%`;q('#stepText').textContent=steps[currentStep];q('#stepArt').innerHTML=window.STEP_ART[currentStep];q('#prev').disabled=currentStep===0;q('#next').textContent=currentStep===steps.length-1?'Finish':'Next';if(cooking)q('#cook').classList.add('active')}
function startTimer(min){clearInterval(timerHandle);timerEnd=Date.now()+min*60000;tick();timerHandle=setInterval(tick,1000)}
function tick(){const left=Math.max(0,timerEnd-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);q('#clock').textContent=`${m}:${String(s).padStart(2,'0')}`;if(left<=0){clearInterval(timerHandle);if(timerEnd)navigator.vibrate?.([200,100,200])}}
function openAnyList(){q('#anyModal').classList.add('show')}
function closeAnyList(){q('#anyModal').classList.remove('show')}
async function shareRecipe(){try{if(navigator.share){await navigator.share({title:window.RECIPE.title,text:'Save this recipe to AnyList',url:location.href})}else{alert('On iPhone, open this page in Safari, tap the Share button, then choose AnyList Recipe Import.')}}catch(e){}}
updateStep();
