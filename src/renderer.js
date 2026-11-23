const canvas = document.getElementById("penguin");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const pet = document.getElementById("pet");
const speech = document.getElementById("speech");
const stats = { hunger: 20, happy: 80, energy: 90 };
const saved = JSON.parse(localStorage.getItem("pip-save") || "null");
if (saved) Object.assign(stats, saved);

function pixel(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function drawPip(blink=false) {
  ctx.clearRect(0,0,96,96);
  // skateboard
  pixel(12,76,72,5,"#9a6239");pixel(17,79,62,2,"#70452b");
  pixel(19,81,9,5,"#42d5e8");pixel(68,81,9,5,"#42d5e8");
  pixel(21,82,5,3,"#2389a9");pixel(70,82,5,3,"#2389a9");
  // feet
  pixel(34,70,12,8,"#f28b38");pixel(53,70,12,8,"#f28b38");
  pixel(31,74,18,4,"#db6c27");pixel(50,74,18,4,"#db6c27");
  // body
  pixel(27,34,42,38,"#182945");pixel(22,43,52,28,"#182945");
  pixel(25,53,46,20,"#182945");
  // belly
  pixel(34,45,28,25,"#fff8e8");pixel(30,49,36,20,"#fff8e8");
  pixel(35,61,26,9,"#fff8e8");
  // wings
  pixel(18,49,10,17,"#182945");pixel(16,56,7,8,"#263c5e");
  pixel(68,49,10,17,"#182945");pixel(73,56,7,8,"#263c5e");
  // face
  pixel(28,29,40,24,"#182945");pixel(32,25,32,8,"#182945");
  pixel(31,35,12,13,"#fff8e8");pixel(53,35,12,13,"#fff8e8");
  if(!blink){pixel(35,38,5,7,"#182945");pixel(56,38,5,7,"#182945");pixel(36,39,2,2,"#fff");pixel(57,39,2,2,"#fff");}
  else {pixel(34,42,7,2,"#182945");pixel(55,42,7,2,"#182945");}
  // beak
  pixel(44,43,8,5,"#f28b38");pixel(41,47,14,4,"#db6c27");
  // cap brim and backwards cap
  pixel(28,20,42,8,"#3576d5");pixel(24,24,48,5,"#3576d5");
  pixel(58,18,12,8,"#2559a7");pixel(65,19,9,7,"#2559a7");
  pixel(27,19,8,5,"#6ca9ff");
  // cap button
  pixel(45,17,4,3,"#8ec4ff");
}
drawPip();
setInterval(()=>drawPip(Math.random()<.13), 2800);

function say(text){speech.textContent=text; speech.style.display="block"; clearTimeout(say.timer);say.timer=setTimeout(()=>speech.style.display="none",3200);}
function update(){
  for(const key of Object.keys(stats)) {
    stats[key]=Math.max(0,Math.min(100,stats[key]));
    document.getElementById(key).style.width=stats[key]+"%";
    document.getElementById(key+"-label").textContent=Math.round(stats[key])+"%";
  }
  localStorage.setItem("pip-save",JSON.stringify(stats));
}
function animate(className,duration=1800){pet.classList.remove("skating","jumping","sleeping");pet.classList.add(className);setTimeout(()=>pet.classList.remove(className),duration);}
document.getElementById("feed").onclick=()=>{stats.hunger=Math.max(0,stats.hunger-35);stats.happy=Math.min(100,stats.happy+8);update();say("Yum! Fish!! 🐟");animate("jumping");};
document.getElementById("play").onclick=()=>{stats.happy=Math.min(100,stats.happy+18);stats.energy=Math.max(0,stats.energy-12);update();say("Kickflip time! 🛹");animate("skating");};
document.getElementById("nap").onclick=()=>{stats.energy=Math.min(100,stats.energy+30);stats.hunger=Math.min(100,stats.hunger+5);update();say("Zzz...");animate("sleeping",2600);};
pet.onclick=()=>{stats.happy=Math.min(100,stats.happy+3);update();say(["Boop!","What's up?","Skate or die!","🐧"][Math.floor(Math.random()*4)]);animate("jumping",700);};
pet.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){pet.click();}};
document.getElementById("close").onclick=()=>window.petDesktop.close();
// Drag the window by its title bar. The native frameless window is moved with mouse delta.
let dragging=false,lastX=0,lastY=0;
const handle=document.getElementById("drag-handle");
handle.addEventListener("mousedown",e=>{if(e.target.closest("button"))return;dragging=true;lastX=e.screenX;lastY=e.screenY;});
window.addEventListener("mousemove",e=>{if(!dragging)return;window.petDesktop.drag(e.screenX-lastX,e.screenY-lastY);lastX=e.screenX;lastY=e.screenY;});
window.addEventListener("mouseup",()=>dragging=false);
setInterval(()=>{stats.hunger=Math.min(100,stats.hunger+0.35);stats.happy=Math.max(0,stats.happy-0.12);stats.energy=Math.max(0,stats.energy-0.08);update();},60000);
update();
