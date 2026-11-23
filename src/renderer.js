const canvas = document.getElementById("penguin");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const pet = document.getElementById("pet");
const speech = document.getElementById("speech");
const scene = document.querySelector(".scene");
const stats = { hunger: 20, happy: 80, energy: 90 };
const saved = JSON.parse(localStorage.getItem("pip-save") || "null");
if (saved) Object.assign(stats, saved);
const state = { pose: "idle", poseUntil: 0, blinkUntil: 0, x: 0, direction: 1, lastSkate: Date.now() };
const colors = { navy:"#182945", dark:"#263c5e", white:"#fff8e8", orange:"#f28b38", orangeDark:"#db6c27", blue:"#3576d5", blueDark:"#2559a7", blueLight:"#6ca9ff", cyan:"#42d5e8", cyanDark:"#2389a9", wood:"#9a6239", woodDark:"#70452b" };
function pixel(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function drawPip(now) {
  ctx.clearRect(0,0,96,96);
  const skateFrame = state.pose === "skate" ? Math.floor(now/150)%2 : 0;
  const jumpFrame = state.pose === "jump" ? Math.floor(now/100)%2 : 0;
  const sleeping = state.pose === "sleep";
  const bob = state.pose==="idle" ? Math.sin(now/500)*1.5 : state.pose==="skate" ? (skateFrame?2:-1) : state.pose==="jump" ? -5-jumpFrame*3 : 1;
  const lean = state.pose==="skate" ? (skateFrame?2:-2) : state.pose==="jump" ? -2 : 0;
  ctx.save(); ctx.translate(48, bob); ctx.rotate(lean*Math.PI/180); ctx.translate(-48,-48);
  pixel(12,76,72,5,colors.wood);pixel(17,79,62,2,colors.woodDark);
  const wheelShift=state.pose==="skate"?Math.floor(now/70)%2:0;
  pixel(19,81,9,5,colors.cyan);pixel(68,81,9,5,colors.cyan);
  pixel(21+wheelShift,82,5,3,colors.cyanDark);pixel(70-wheelShift,82,5,3,colors.cyanDark);
  pixel(34,70,12,8,colors.orange);pixel(53,70,12,8,colors.orange);
  pixel(31,74,18,4,colors.orangeDark);pixel(50,74,18,4,colors.orangeDark);
  pixel(27,34,42,38,colors.navy);pixel(22,43,52,28,colors.navy);pixel(25,53,46,20,colors.navy);
  pixel(34,45,28,25,colors.white);pixel(30,49,36,20,colors.white);pixel(35,61,26,9,colors.white);
  const wingY=state.pose==="skate"?(skateFrame?53:47):state.pose==="jump"?44:49;
  pixel(18,wingY,10,17,colors.navy);pixel(16,wingY+7,7,8,colors.dark);pixel(68,wingY,10,17,colors.navy);pixel(73,wingY+7,7,8,colors.dark);
  pixel(28,29,40,24,colors.navy);pixel(32,25,32,8,colors.navy);pixel(31,35,12,13,colors.white);pixel(53,35,12,13,colors.white);
  const blink=now<state.blinkUntil||sleeping;
  if(!blink){pixel(35,38,5,7,colors.navy);pixel(56,38,5,7,colors.navy);pixel(36,39,2,2,"#fff");pixel(57,39,2,2,"#fff");}else{pixel(34,42,7,2,colors.navy);pixel(55,42,7,2,colors.navy);}
  pixel(44,43,8,5,colors.orange);pixel(41,47,14,4,colors.orangeDark);
  pixel(28,20,42,8,colors.blue);pixel(24,24,48,5,colors.blue);pixel(58,18,12,8,colors.blueDark);pixel(65,19,9,7,colors.blueDark);pixel(27,19,8,5,colors.blueLight);pixel(45,17,4,3,"#8ec4ff");
  if(state.pose==="jump")pixel(39,57,18,3,colors.orangeDark);
  ctx.restore();
}
function say(text){speech.textContent=text;speech.style.display="block";clearTimeout(say.timer);say.timer=setTimeout(()=>speech.style.display="none",3200);}
function update(){for(const key of Object.keys(stats)){stats[key]=Math.max(0,Math.min(100,stats[key]));document.getElementById(key).style.width=stats[key]+"%";document.getElementById(key+"-label").textContent=Math.round(stats[key])+"%";}localStorage.setItem("pip-save",JSON.stringify(stats));}
function setPose(pose,duration=0){state.pose=pose;state.poseUntil=duration?Date.now()+duration:0;pet.classList.toggle("sleeping",pose==="sleep");}
function animate(pose,duration=1500){setPose(pose,duration);}
function bounds(){return Math.max(0,scene.clientWidth-116);}
function frame(now){if(state.poseUntil&&Date.now()>state.poseUntil)setPose("idle");if(state.pose==="idle"&&Date.now()-state.lastSkate>12000&&stats.energy>15){state.lastSkate=Date.now();setPose("skate",2200);}if(state.pose==="skate"&&!state.poseUntil){state.x+=state.direction*1.1;if(state.x>=bounds()){state.x=bounds();state.direction=-1;}if(state.x<=0){state.x=0;state.direction=1;}}pet.style.left=state.x+"px";pet.style.transform="translateX(0) scaleX("+state.direction+")";drawPip(now);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
setInterval(()=>{state.blinkUntil=Date.now()+130;},3500+Math.random()*2500);
function handleAction(action){if(action==="feed"){stats.hunger=Math.max(0,stats.hunger-35);stats.happy=Math.min(100,stats.happy+8);update();say("Yum! Fish!! 🐟");animate("jump",900);}if(action==="play"){stats.happy=Math.min(100,stats.happy+18);stats.energy=Math.max(0,stats.energy-12);update();say("Kickflip time! 🛹");animate("skate",2200);}if(action==="nap"){stats.energy=Math.min(100,stats.energy+30);stats.hunger=Math.min(100,stats.hunger+5);update();say("Zzz...");animate("sleep",2600);}}
document.getElementById("feed").onclick=()=>handleAction("feed");document.getElementById("play").onclick=()=>handleAction("play");document.getElementById("nap").onclick=()=>handleAction("nap");
pet.onclick=()=>{stats.happy=Math.min(100,stats.happy+3);update();say(["Boop!","What's up?","Skate or die!","🐧"][Math.floor(Math.random()*4)]);animate("jump",650);};pet.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pet.click();}};
document.getElementById("close").onclick=()=>window.petDesktop.close();
let dragging=false,lastX=0,lastY=0;const handle=document.getElementById("drag-handle");handle.addEventListener("mousedown",e=>{if(e.target.closest("button"))return;dragging=true;lastX=e.screenX;lastY=e.screenY;});window.addEventListener("mousemove",e=>{if(!dragging)return;window.petDesktop.drag(e.screenX-lastX,e.screenY-lastY);lastX=e.screenX;lastY=e.screenY;});window.addEventListener("mouseup",()=>dragging=false);
setInterval(()=>{if(state.pose!=="sleep"){stats.hunger=Math.min(100,stats.hunger+0.35);stats.happy=Math.max(0,stats.happy-0.12);stats.energy=Math.max(0,stats.energy-0.08);}update();},60000);update();
