const canvas = document.getElementById("penguin");
const ctx = canvas.getContext("2d");
canvas.width = 96;
canvas.height = 144;
ctx.imageSmoothingEnabled = false;
const pet = document.getElementById("pet");
const speech = document.getElementById("speech");
const scene = document.querySelector(".scene");
let desktopMode = false;
let desktopDirection = 1;
const defaultStats = { hunger: 20, happy: 80, energy: 90 };
const characterNames = { pip: "Pip", shredasaurus: "Shredasaurus", mechanic: "The Mechanic" };
const characterOrder = ["pip", "shredasaurus", "mechanic"];
const savedCharacter = localStorage.getItem("selected-pet");
let selectedCharacter = characterOrder.includes(savedCharacter) ? savedCharacter : "pip";
function loadStats() {
  const key = "pet-save-" + selectedCharacter;
  const saved = JSON.parse(localStorage.getItem(key) || (selectedCharacter === "pip" ? localStorage.getItem("pip-save") : "null") || "null");
  return { ...defaultStats, ...(saved || {}) };
}
let stats = loadStats();
const positionKey = "pip-vertical-position";
let pipVerticalOffset = Number(localStorage.getItem(positionKey) || 0);
pipVerticalOffset = Math.max(-24, Math.min(24, pipVerticalOffset));
function applyPipPosition() { pet.style.top = (90 + pipVerticalOffset) + "px"; }
function adjustPipPosition(amount) {
  pipVerticalOffset = Math.max(-24, Math.min(24, pipVerticalOffset + amount));
  localStorage.setItem(positionKey, String(pipVerticalOffset));
  applyPipPosition();
}

const state = {
  pose: "idle",
  poseUntil: 0,
  blinkUntil: 0,
  x: Math.max(0, scene.clientWidth / 2 - 58),
  direction: 1,
  lastSkate: Date.now(),
  nextTrick: 0,
  lastFrame: 0
};

const characterSprites = { pip: new Image(), shredasaurus: new Image(), mechanic: new Image() };
characterSprites.pip.src = "../assets/pip-sprites.png";
characterSprites.shredasaurus.src = "../assets/shredasaurus-sprites.png";
characterSprites.mechanic.src = "../assets/mechanic-reference-sprites.webp";
const banana = document.getElementById("banana");

function drawPip(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sprites = characterSprites[selectedCharacter];
  if (!sprites.complete || !sprites.naturalWidth) return;
  const frames = selectedCharacter === "mechanic"
    ? { idle: [0, 1, 2, 3], skate: [4, 5, 6, 7], trick: [9, 10], jump: [8, 9], happy: [10], surprised: [8], sad: [11], fall: [8], sleep: [0] }
    : selectedCharacter === "shredasaurus"
      ? { idle: [0, 1, 2], skate: [3, 4, 5], trick: [6, 8], jump: [7], happy: [9], surprised: [10], sad: [10], fall: [10], sleep: [11] }
      : { idle: [0, 1, 2], skate: [3, 4, 5], trick: [6, 7], jump: [8], happy: [8], surprised: [9], sad: [10], fall: [10], sleep: [11] };
  const sequence = frames[state.pose] || frames.idle;
  const speed = state.pose === "skate" ? 135
    : state.pose === "trick" ? 165
    : state.pose === "idle" ? 520 : 210;
  const frame = sequence[Math.floor(now / speed) % sequence.length];
  ctx.imageSmoothingEnabled = false;
  if (selectedCharacter === "mechanic") {
    ctx.drawImage(sprites, frame * 32, 0, 32, 48, 0, 0, 96, 144);
  } else {
    ctx.drawImage(sprites, frame * 32, 0, 32, 32, 0, 0, 96, 96);
  }
}

function say(text) {
  speech.textContent = text;
  speech.style.display = "block";
  clearTimeout(say.timer);
  say.timer = setTimeout(() => speech.style.display = "none", 3200);
}

function update() {
  for (const key of Object.keys(stats)) {
    stats[key] = Math.max(0, Math.min(100, stats[key]));
    document.getElementById(key).style.width = stats[key] + "%";
    document.getElementById(key + "-label").textContent = Math.round(stats[key]) + "%";
  }
  localStorage.setItem("pet-save-" + selectedCharacter, JSON.stringify(stats));
  if (selectedCharacter === "pip") localStorage.setItem("pip-save", JSON.stringify(stats));
}

function setPose(pose, duration = 0) {
  state.pose = pose;
  state.poseUntil = duration ? Date.now() + duration : 0;
  const isSkating = pose === "skate" || pose === "trick";
  // In regular Pet Mode only Pip's CSS position changes inside the scene.
  // Only Desktop Mode is allowed to animate the native Electron window.
  window.petDesktop?.setSkating(desktopMode && isSkating);
  pet.classList.toggle("sleeping", pose === "sleep");
  pet.classList.toggle("skating", isSkating);
  pet.classList.toggle("jumping", pose === "jump");
}

function animate(pose, duration = 1500) {
  setPose(pose, duration);
}

function bounds() {
  return Math.max(0, scene.clientWidth - 116);
}

function frame(now) {
  const currentTime = Date.now();
  if (state.poseUntil && currentTime > state.poseUntil) setPose(selectedCharacter === "mechanic" ? "skate" : "idle");
  if (selectedCharacter === "mechanic" && state.pose === "idle") setPose("skate");

  if (state.pose === "idle" && currentTime - state.lastSkate > 10500 && stats.energy > 15) {
    state.lastSkate = currentTime;
    state.nextTrick = currentTime + 1450;
    setPose("skate", 2900);
  }

  if (state.pose === "skate" || state.pose === "trick") {
    const elapsed = state.lastFrame ? Math.min(40, now - state.lastFrame) : 16;
    state.x += state.direction * elapsed * 0.055;
    if (state.x >= bounds()) {
      state.x = bounds();
      state.direction = -1;
    }
    if (state.x <= 0) {
      state.x = 0;
      state.direction = 1;
    }
    if (state.pose === "skate" && currentTime >= state.nextTrick) {
      state.nextTrick = currentTime + (selectedCharacter === "mechanic" ? 14000 : 5000);
      setPose("trick", selectedCharacter === "mechanic" ? 420 : 620);
    }
  }

  if (banana) {
    banana.hidden = selectedCharacter !== "mechanic";
  canvas.height = selectedCharacter === "mechanic" ? 144 : 96;
    if (!banana.hidden) {
      const bananaX = state.x + (state.direction > 0 ? 70 : -8);
      banana.style.left = Math.max(0, Math.min(scene.clientWidth - 25, bananaX)) + "px";
    }
  }
  state.lastFrame = now;
  pet.style.left = state.x + "px";
  pet.style.transform = "translateX(0) scaleX(" + (desktopMode ? desktopDirection : state.direction) + ")";
  drawPip(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setInterval(() => {
  state.blinkUntil = Date.now() + 130;
}, 3500 + Math.random() * 2500);

function handleAction(action) {
  if (action === "feed") {
    stats.hunger = Math.max(0, stats.hunger - 35);
    stats.happy = Math.min(100, stats.happy + 8);
    update();
    say(selectedCharacter === "shredasaurus" ? "Dino-sized snack!! 🐟" : "Yum! Fish!! 🐟");
    animate("jump", 900);
  }
  if (action === "play") {
    stats.happy = Math.min(100, stats.happy + 18);
    stats.energy = Math.max(0, stats.energy - 12);
    update();
    say(selectedCharacter === "shredasaurus" ? "Witness the SHRED!! 🛹" : "Check this out! 🛹");
    animate("trick", 1300);
  }
  if (action === "nap") {
    stats.energy = Math.min(100, stats.energy + 30);
    stats.hunger = Math.min(100, stats.hunger + 5);
    update();
    say(selectedCharacter === "shredasaurus" ? "Even legends need a nap..." : "Zzz... sweet dreams");
    animate("sleep", 2600);
  }
}


const switchCharacterButton = document.getElementById("switch-character");
function refreshCharacterLabel() {
  const name = characterNames[selectedCharacter];
  pet.classList.toggle("mechanic", selectedCharacter === "mechanic");
  document.getElementById("brand-name").textContent = name.toUpperCase();
  switchCharacterButton.textContent = "Switch Pet ↻";
  const nextCharacter = characterOrder[(characterOrder.indexOf(selectedCharacter) + 1) % characterOrder.length];
  switchCharacterButton.title = "Switch to " + characterNames[nextCharacter];
  banana.hidden = selectedCharacter !== "mechanic";
  pet.setAttribute("title", selectedCharacter === "mechanic" ? "Click to jump for the banana!" : "Click " + name + "!");
}
switchCharacterButton.onclick = () => {
  selectedCharacter = characterOrder[(characterOrder.indexOf(selectedCharacter) + 1) % characterOrder.length];
  localStorage.setItem("selected-pet", selectedCharacter);
  stats = loadStats();
  state.direction = 1;
  state.x = Math.max(0, scene.clientWidth / 2 - 58);
  pet.style.left = state.x + "px";
  setPose(selectedCharacter === "mechanic" ? "skate" : "idle");
  refreshCharacterLabel();
  update();
  say(selectedCharacter === "shredasaurus" ? "Shredasaurus is ready to shred! 😎" : selectedCharacter === "mechanic" ? "The Mechanic is chasing that banana! 🍌" : "Pip is back on the board! 🐧");
};
refreshCharacterLabel();

document.getElementById("feed").onclick = () => handleAction("feed");
document.getElementById("play").onclick = () => handleAction("play");
document.getElementById("nap").onclick = () => handleAction("nap");

pet.onclick = () => {
  if (suppressPetClick) { suppressPetClick = false; return; }
  stats.happy = Math.min(100, stats.happy + 3);
  update();
  if (selectedCharacter === "mechanic") {
    say("BANANA TIME! 🍌");
    banana.classList.remove("banana-grabbed");
    void banana.offsetWidth;
    banana.classList.add("banana-grabbed");
    setTimeout(() => banana.classList.remove("banana-grabbed"), 650);
    animate("jump", 720);
  } else {
    const greetings = selectedCharacter === "shredasaurus" ? ["Too cool. 😎", "ROAR means hello!", "Watch this trick!", "Tiny arms, BIG style."] : ["Boop!", "What's up?", "Skate or die!", "🐧"];
    say(greetings[Math.floor(Math.random() * greetings.length)]);
    animate("jump", 650);
  }
};
pet.onkeydown = (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    pet.click();
  }
};

const desktopOnly = Boolean(window.petDesktop);
if (!desktopOnly) {
  document.getElementById("close").hidden = true;
  document.querySelector("footer").textContent = "Click your pet to interact · Progress saves automatically";
}
document.getElementById("close").onclick = () => window.petDesktop?.close();
document.getElementById("minimize").onclick = () => window.petDesktop?.minimize();
document.getElementById("raise-pip").onclick = () => adjustPipPosition(-2);
document.getElementById("lower-pip").onclick = () => adjustPipPosition(2);
document.getElementById("reset-pip").onclick = () => {
  pipVerticalOffset = 0;
  localStorage.setItem(positionKey, "0");
  applyPipPosition();
};
applyPipPosition();

let dragging = false;
let lastX = 0;
let lastY = 0;
const handle = document.getElementById("drag-handle");
handle.addEventListener("mousedown", (event) => {
  if (event.target.closest("button")) return;
  dragging = true;
  lastX = event.screenX;
  lastY = event.screenY;
});
window.addEventListener("mousemove", (event) => {
  if (!dragging) return;
  const dx = event.screenX - lastX;
  const dy = event.screenY - lastY;
  if (petDragging && (dx !== 0 || dy !== 0)) suppressPetClick = true;
  window.petDesktop?.drag(dx, dy);
  lastX = event.screenX;
  lastY = event.screenY;
});
window.addEventListener("mouseup", () => { dragging = false; });

setInterval(() => {
  if (state.pose !== "sleep") {
    stats.hunger = Math.min(100, stats.hunger + 0.35);
    stats.happy = Math.max(0, stats.happy - 0.12);
    stats.energy = Math.max(0, stats.energy - 0.08);
  }
  update();
}, 60000);

update();

function applyDesktopMode(enabled) {
  desktopMode = Boolean(enabled);
  document.body.classList.toggle("desktop-mode", desktopMode);
  if (desktopMode) { state.poseUntil = 0; setPose("skate"); } else { setPose("idle"); }
  state.x = Math.max(0, scene.clientWidth / 2 - 58);
  pet.style.left = state.x + "px";
  handle.style.cursor = desktopMode ? "default" : "grab";
  pet.style.cursor = desktopMode ? "grab" : "pointer";
  pet.setAttribute("title", desktopMode
    ? "Drag " + characterNames[selectedCharacter] + " around your desktop · Toggle Desktop Mode to show controls"
    : selectedCharacter === "mechanic" ? "Click to jump for the banana!" : "Click " + characterNames[selectedCharacter] + "!");
}
window.petDesktop?.onDesktopMode(applyDesktopMode);
window.petDesktop?.onDesktopDirection((direction) => { desktopDirection = direction; });

let petDragging = false;
let suppressPetClick = false;
pet.addEventListener("mousedown", (event) => {
  if (!document.body.classList.contains("desktop-mode") || event.button !== 0) return;
  petDragging = true;
  suppressPetClick = false;
  window.petDesktop?.beginDrag();
  dragging = true;
  lastX = event.screenX;
  lastY = event.screenY;
});
window.addEventListener("mouseup", () => {
  if (petDragging) {
    petDragging = false;
    dragging = false;
    window.petDesktop?.endDrag();
  }
});
