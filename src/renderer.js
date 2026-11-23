const canvas = document.getElementById("penguin");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const pet = document.getElementById("pet");
const speech = document.getElementById("speech");
const scene = document.querySelector(".scene");
const stats = { hunger: 20, happy: 80, energy: 90 };
const saved = JSON.parse(localStorage.getItem("pip-save") || "null");
if (saved) Object.assign(stats, saved);

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

const colors = {
  navy: "#182945", dark: "#263c5e", white: "#fff8e8",
  orange: "#f28b38", orangeDark: "#db6c27",
  blue: "#3576d5", blueDark: "#2559a7", blueLight: "#6ca9ff",
  cyan: "#42d5e8", cyanDark: "#2389a9",
  wood: "#9a6239", woodDark: "#70452b", sparkle: "#fff2a8"
};

function pixel(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawSparkle(x, y, size, color) {
  pixel(x + size, y, size, size, color);
  pixel(x, y + size, size * 3, size, color);
  pixel(x + size, y + size * 2, size, size, color);
}

function drawPip(now) {
  ctx.clearRect(0, 0, 96, 96);
  const skating = state.pose === "skate" || state.pose === "trick";
  const skateFrame = skating ? Math.floor(now / 115) % 2 : 0;
  const jumpFrame = state.pose === "jump" ? Math.floor(now / 100) % 2 : 0;
  const sleeping = state.pose === "sleep";
  const falling = state.pose === "fall";
  const bob = state.pose === "idle"
    ? Math.sin(now / 500) * 1.5
    : skating ? (skateFrame ? 2 : -1)
    : state.pose === "jump" ? -5 - jumpFrame * 3
    : state.pose === "trick" ? -8 - Math.abs(Math.sin(now / 75)) * 5
    : falling ? 5 : 1;
  const lean = skating ? (skateFrame ? 3 : -3)
    : state.pose === "jump" ? -2
    : state.pose === "trick" ? Math.sin(now / 65) * 17
    : falling ? 22 : 0;

  ctx.save();
  ctx.translate(48, bob + (falling ? 7 : 0));
  ctx.rotate(lean * Math.PI / 180);
  ctx.translate(-48, -48);

  // Speed streaks and little trick sparkles.
  if (skating) {
    pixel(3, 54 + skateFrame * 3, 11, 2, "#ffffff");
    pixel(8, 62 - skateFrame * 2, 7, 2, "#ffffff");
    if (state.pose === "trick") {
      drawSparkle(8, 28, 2, colors.sparkle);
      drawSparkle(77, 48, 2, colors.sparkle);
    }
  }

  // Board, spinning wheels, feet and body.
  pixel(12, 76, 72, 5, colors.wood);
  pixel(17, 79, 62, 2, colors.woodDark);
  const wheelFrame = skating ? Math.floor(now / 55) % 3 : 0;
  pixel(19, 81, 9, 5, colors.cyan);
  pixel(68, 81, 9, 5, colors.cyan);
  pixel(20 + wheelFrame, 82, 4, 3, colors.cyanDark);
  pixel(69 + ((3 - wheelFrame) % 3), 82, 4, 3, colors.cyanDark);
  pixel(34, 70, 12, 8, colors.orange);
  pixel(53, 70, 12, 8, colors.orange);
  pixel(31, 74, 18, 4, colors.orangeDark);
  pixel(50, 74, 18, 4, colors.orangeDark);

  pixel(27, 34, 42, 38, colors.navy);
  pixel(22, 43, 52, 28, colors.navy);
  pixel(25, 53, 46, 20, colors.navy);
  pixel(34, 45, 28, 25, colors.white);
  pixel(30, 49, 36, 20, colors.white);
  pixel(35, 61, 26, 9, colors.white);

  const wingY = skating ? (skateFrame ? 53 : 45)
    : state.pose === "jump" || state.pose === "trick" ? 39
    : falling ? 42 : 49;
  pixel(18, wingY, 10, 17, colors.navy);
  pixel(16, wingY + 7, 7, 8, colors.dark);
  pixel(68, wingY, 10, 17, colors.navy);
  pixel(73, wingY + 7, 7, 8, colors.dark);

  pixel(28, 20, 42, 24, colors.navy);
  pixel(32, 25, 32, 8, colors.navy);
  pixel(31, 35, 12, 13, colors.white);
  pixel(53, 35, 12, 13, colors.white);
  const blink = now < state.blinkUntil || sleeping;
  if (!blink) {
    pixel(35, 38, 5, 7, colors.navy);
    pixel(56, 38, 5, 7, colors.navy);
    pixel(36, 39, 2, 2, "#fff");
    pixel(57, 39, 2, 2, "#fff");
  } else {
    pixel(34, 42, 7, 2, colors.navy);
    pixel(55, 42, 7, 2, colors.navy);
  }

  pixel(44, 43, 8, 5, colors.orange);
  pixel(41, 47, 14, 4, colors.orangeDark);
  // Signature backwards blue cap.
  pixel(28, 20, 42, 8, colors.blue);
  pixel(24, 24, 48, 5, colors.blue);
  pixel(58, 18, 12, 8, colors.blueDark);
  pixel(65, 19, 9, 7, colors.blueDark);
  pixel(27, 19, 8, 5, colors.blueLight);
  pixel(45, 17, 4, 3, "#8ec4ff");

  if (state.pose === "jump" || state.pose === "trick") {
    pixel(39, 57, 18, 3, colors.orangeDark);
  }
  if (sleeping) {
    drawSparkle(74, 20, 2, "#ffffff");
  }
  ctx.restore();
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
  localStorage.setItem("pip-save", JSON.stringify(stats));
}

function setPose(pose, duration = 0) {
  state.pose = pose;
  state.poseUntil = duration ? Date.now() + duration : 0;
  const isSkating = pose === "skate" || pose === "trick";
  window.petDesktop.setSkating(isSkating);
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
  if (state.poseUntil && currentTime > state.poseUntil) setPose("idle");

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
    // Pip occasionally throws in a tiny ollie while cruising.
    if (state.pose === "skate" && currentTime >= state.nextTrick) {
      state.nextTrick = currentTime + 5000;
      setPose("trick", 620);
    }
  }

  state.lastFrame = now;
  pet.style.left = state.x + "px";
  pet.style.transform = "translateX(0) scaleX(" + state.direction + ")";
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
    say("Yum! Fish!! 🐟");
    animate("jump", 900);
  }
  if (action === "play") {
    stats.happy = Math.min(100, stats.happy + 18);
    stats.energy = Math.max(0, stats.energy - 12);
    update();
    say("Check this out! 🛹");
    animate("trick", 1300);
  }
  if (action === "nap") {
    stats.energy = Math.min(100, stats.energy + 30);
    stats.hunger = Math.min(100, stats.hunger + 5);
    update();
    say("Zzz... sweet dreams");
    animate("sleep", 2600);
  }
}

document.getElementById("feed").onclick = () => handleAction("feed");
document.getElementById("play").onclick = () => handleAction("play");
document.getElementById("nap").onclick = () => handleAction("nap");

pet.onclick = () => {
  stats.happy = Math.min(100, stats.happy + 3);
  update();
  say(["Boop!", "What's up?", "Skate or die!", "🐧"][Math.floor(Math.random() * 4)]);
  animate("jump", 650);
};
pet.onkeydown = (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    pet.click();
  }
};

document.getElementById("close").onclick = () => window.petDesktop.close();

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
  window.petDesktop.drag(event.screenX - lastX, event.screenY - lastY);
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
