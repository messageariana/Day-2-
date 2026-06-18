// =========================================================
//  ARIANA'S ADVENTURE  🌸
//  A cute & cozy platformer with 4 levels.
//  Arrow keys = move, Space or Up = jump.
//  Collect the hearts, reach the glowing goal!
// =========================================================

// ---- Grab the HTML pieces we need ----
const playGameBtn    = document.getElementById("playGameBtn");
const gameModal      = document.getElementById("gameModal");
const closeGameBtn   = document.getElementById("closeGameBtn");
const resetGameBtn   = document.getElementById("resetGameBtn");
const nextLevelBtn   = document.getElementById("nextLevelBtn");
const canvas         = document.getElementById("gameCanvas");
const ctx            = canvas.getContext("2d");

const levelNumberEl  = document.getElementById("levelNumber");
const factDisplay    = document.getElementById("factDisplay");
const gameOverScreen = document.getElementById("gameOver");
const gameOverTitle  = document.getElementById("gameOverTitle");
const gameOverMessage = document.getElementById("gameOverMessage");

const W = canvas.width;   // 800
const H = canvas.height;  // 500

// ---------------------------------------------------------
//  THE 4 LEVELS
//  Each platform is {x, y, w, h}. Add vx + range for movers.
//  Difficulty gently ramps up; level 4 is the tricky one.
// ---------------------------------------------------------
const LEVELS = [
  { // LEVEL 1 — warm-up, but with real jumps now
    emoji: "💙",
    sky: ["#dff3ff", "#bfe6ff"],
    fact: "My favorite color is blue! 💙",
    start: { x: 40, y: 400 },
    goal:  { x: 702, y: 252, w: 52, h: 64 },
    platforms: [
      { x: 0,   y: 460, w: 190, h: 40 },
      { x: 285, y: 406, w: 78,  h: 20 },
      { x: 435, y: 356, w: 72,  h: 20 },
      { x: 580, y: 310, w: 72,  h: 20 },
      { x: 690, y: 316, w: 96,  h: 20 }
    ],
    coins: [ {x: 324, y: 372}, {x: 471, y: 322}, {x: 616, y: 276}, {x: 735, y: 282} ]
  },
  { // LEVEL 2 — zig-zag climb with small ledges
    emoji: "🎯",
    sky: ["#ffe9f1", "#ffd0e4"],
    fact: "My favorite store is Target! 🎯",
    start: { x: 40, y: 400 },
    goal:  { x: 712, y: 108, w: 52, h: 64 },
    platforms: [
      { x: 0,   y: 460, w: 165, h: 40 },
      { x: 250, y: 408, w: 72,  h: 20 },
      { x: 395, y: 356, w: 68,  h: 20 },
      { x: 540, y: 302, w: 68,  h: 20 },
      { x: 395, y: 248, w: 66,  h: 20 },
      { x: 560, y: 196, w: 72,  h: 20 },
      { x: 705, y: 172, w: 90,  h: 20 }
    ],
    coins: [ {x: 286, y: 374}, {x: 429, y: 322}, {x: 428, y: 214}, {x: 596, y: 162}, {x: 740, y: 138} ]
  },
  { // LEVEL 3 — climb + a moving platform
    emoji: "🎤",
    sky: ["#efe6ff", "#dcc9ff"],
    fact: "My favorite artist is Olivia Rodrigo! 🎤",
    start: { x: 40, y: 400 },
    goal:  { x: 296, y: 96, w: 52, h: 64 },
    platforms: [
      { x: 0,   y: 460, w: 800, h: 40 },
      { x: 110, y: 396, w: 70,  h: 20 },
      { x: 270, y: 348, w: 64,  h: 20 },
      { x: 410, y: 300, w: 80,  h: 20, vx: 1.8, min: 410, max: 580 },
      { x: 300, y: 250, w: 62,  h: 20 },
      { x: 150, y: 206, w: 66,  h: 20 },
      { x: 320, y: 160, w: 62,  h: 20 }
    ],
    coins: [ {x: 145, y: 362}, {x: 302, y: 314}, {x: 331, y: 216}, {x: 183, y: 172}, {x: 351, y: 126} ]
  },
  { // LEVEL 4 — TRICKY: tiny platforms, a fast mover, long gaps
    emoji: "🐶",
    sky: ["#fff0d9", "#ffd9c2"],
    fact: "I really, really want a dog someday! 🐶",
    start: { x: 24, y: 400 },
    goal:  { x: 730, y: 104, w: 52, h: 64 },
    platforms: [
      { x: 0,   y: 460, w: 130, h: 40 },
      { x: 200, y: 416, w: 62,  h: 20 },
      { x: 320, y: 360, w: 58,  h: 20 },
      // fast-moving platform
      { x: 430, y: 304, w: 76,  h: 20, vx: 2.4, min: 430, max: 610 },
      { x: 300, y: 256, w: 56,  h: 20 },
      { x: 450, y: 206, w: 56,  h: 20 },
      { x: 610, y: 176, w: 64,  h: 20 },
      { x: 720, y: 168, w: 80,  h: 20 }
    ],
    coins: [ {x: 231, y: 382}, {x: 349, y: 326}, {x: 328, y: 222}, {x: 478, y: 172}, {x: 642, y: 142} ]
  }
];

// ---- Tunable feel (cozy = forgiving) ----
const GRAVITY     = 0.62;
const MOVE_SPEED   = 4.2;
const JUMP_POWER   = -12.6;
const COYOTE_FRAMES = 6;   // tiny grace period to still jump just after leaving a ledge
const COIN_R        = 11;

// ---- State ----
let levelIndex = 0;
let player = null;
let keys = {};
let coins = [];
let particles = [];
let confetti = [];
let levelCleared = false;
let animationId = null;
let bounce = 0;          // squash & stretch amount
let totalCoins = 0;
let collectedCoins = 0;

function makePlayer(level) {
  return {
    x: level.start.x, y: level.start.y,
    w: 32, h: 32,
    vx: 0, vy: 0,
    onGround: false,
    coyote: 0,
    facing: 1
  };
}

function loadLevel(index) {
  levelIndex = index;
  const level = LEVELS[index];
  // deep-copy platforms so moving ones reset each load
  level._plats = level.platforms.map(p => ({ ...p }));
  player = makePlayer(level);
  coins = level.coins.map(c => ({ x: c.x, y: c.y, got: false, t: Math.random() * 6 }));
  totalCoins = coins.length;
  collectedCoins = 0;
  particles = [];
  confetti = [];
  levelCleared = false;
  bounce = 0;
  keys = {};
  levelNumberEl.textContent = index + 1;
  factDisplay.textContent = level.emoji + "  Collect the hearts and reach the goal!";
  gameOverScreen.style.display = "none";
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------------------------------------------------------
//  UPDATE (physics + collisions)
// ---------------------------------------------------------
function update() {
  const level = LEVELS[levelIndex];
  const plats = level._plats;

  // move any moving platforms first, remember how far they moved
  for (const p of plats) {
    if (p.vx) {
      p.x += p.vx;
      if (p.x < p.min || p.x + p.w > p.max + p.w) {} // (kept simple below)
      if (p.x <= p.min) { p.x = p.min; p.vx *= -1; }
      if (p.x >= p.max) { p.x = p.max; p.vx *= -1; }
    }
  }

  // horizontal input
  player.vx = 0;
  if (keys["ArrowLeft"])  { player.vx = -MOVE_SPEED; player.facing = -1; }
  if (keys["ArrowRight"]) { player.vx =  MOVE_SPEED; player.facing =  1; }

  // move X, resolve against platforms
  player.x += player.vx;
  for (const p of plats) {
    if (overlaps(player, p)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
    }
  }

  // gravity + move Y
  player.vy += GRAVITY;
  if (player.vy > 17) player.vy = 17;
  player.y += player.vy;

  const wasInAir = !player.onGround;
  player.onGround = false;
  let standingOn = null;
  for (const p of plats) {
    if (overlaps(player, p)) {
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        standingOn = p;
      } else if (player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }

  // ride moving platforms
  if (standingOn && standingOn.vx) player.x += standingOn.vx;

  // coyote time bookkeeping
  if (player.onGround) {
    player.coyote = COYOTE_FRAMES;
    if (wasInAir) {            // just landed -> squash + dust
      bounce = -7;
      spawnDust(player.x + player.w / 2, player.y + player.h);
    }
  } else if (player.coyote > 0) {
    player.coyote--;
  }

  // ease the squash/stretch back to normal
  bounce += (0 - bounce) * 0.2;

  // walls
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > W) player.x = W - player.w;

  // fell off the bottom -> gently respawn at start
  if (player.y > H + 80) {
    const lv = LEVELS[levelIndex];
    player = makePlayer(lv);
  }

  // collect coins
  for (const c of coins) {
    if (!c.got) {
      const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
      if (Math.hypot(cx - c.x, cy - c.y) < 26) {
        c.got = true;
        collectedCoins++;
        spawnSparkle(c.x, c.y);
      }
    }
  }

  // reach goal
  if (!levelCleared && overlaps(player, level.goal)) {
    levelCleared = true;
    winLevel();
  }

  updateParticles();
}

function spawnDust(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2,
      life: 18, max: 18, kind: "dust"
    });
  }
}
function spawnSparkle(x, y) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 24, max: 24, kind: "spark"
    });
  }
}
function updateParticles() {
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (p.kind === "dust") p.vy += 0.15;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  for (const c of confetti) {
    c.x += c.vx; c.y += c.vy; c.vy += 0.12; c.rot += c.vr;
  }
  confetti = confetti.filter(c => c.y < H + 30);
}

// ---------------------------------------------------------
//  DRAW
// ---------------------------------------------------------
function draw() {
  const level = LEVELS[levelIndex];

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, level.sky[0]);
  sky.addColorStop(1, level.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // soft background hills
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  blob(120, H, 260, 150);
  blob(430, H, 320, 190);
  blob(720, H, 240, 150);

  // floating clouds
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  cloud(150, 90); cloud(560, 70); cloud(380, 140);

  // platforms (rounded, with a soft top highlight)
  for (const p of level._plats) {
    ctx.fillStyle = "#ff8fc1";
    roundRect(p.x, p.y, p.w, p.h, 9); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    roundRect(p.x + 4, p.y + 3, p.w - 8, 5, 3); ctx.fill();
  }

  // coins (bobbing hearts)
  for (const c of coins) {
    if (c.got) continue;
    c.t += 0.08;
    const yy = c.y + Math.sin(c.t) * 3;
    drawHeart(c.x, yy, COIN_R, "#ff5ba0");
  }

  // goal: glowing pedestal + emoji
  const g = level.goal;
  const gx = g.x + g.w / 2, gy = g.y + g.h / 2;
  ctx.save();
  ctx.shadowColor = "#ffd451"; ctx.shadowBlur = 26;
  ctx.fillStyle = "#fff6d6";
  ctx.beginPath(); ctx.arc(gx, gy, g.w / 2 + 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.font = "40px serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(level.emoji, gx, gy + 2);

  drawPlayer();

  // particles
  for (const p of particles) {
    const alpha = p.life / p.max;
    if (p.kind === "dust") {
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255,209,231,${alpha})`;
      ctx.font = "14px serif"; ctx.textAlign = "center";
      ctx.fillText("✦", p.x, p.y);
    }
  }

  // confetti (win screen)
  for (const c of confetti) {
    ctx.save();
    ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  // coin counter
  ctx.fillStyle = "rgba(123,76,99,0.9)";
  ctx.font = "bold 18px Nunito, sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`♡ ${collectedCoins}/${totalCoins}`, 16, 14);
}

function drawPlayer() {
  const squash = bounce;                 // negative = squashed wider/flatter
  const w = player.w - squash;
  const h = player.h + squash;
  const px = player.x + (player.w - w) / 2;
  const py = player.y + (player.h - h);

  // body
  ctx.fillStyle = "#ff6eac";
  roundRect(px, py, w, h, 11); ctx.fill();
  // cheek shine
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath(); ctx.arc(px + w * 0.3, py + h * 0.32, 4, 0, Math.PI * 2); ctx.fill();
  // eyes (look in facing direction)
  const dir = player.facing;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(px + w * 0.34, py + h * 0.4, 4.2, 0, Math.PI * 2);
  ctx.arc(px + w * 0.66, py + h * 0.4, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7b4c63";
  ctx.beginPath();
  ctx.arc(px + w * 0.34 + dir, py + h * 0.4, 2, 0, Math.PI * 2);
  ctx.arc(px + w * 0.66 + dir, py + h * 0.4, 2, 0, Math.PI * 2);
  ctx.fill();
  // smile
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + w * 0.5, py + h * 0.52, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // little bow on top
  ctx.fillStyle = "#ff3d86";
  ctx.beginPath();
  ctx.moveTo(px + w * 0.5, py - 1);
  ctx.lineTo(px + w * 0.5 - 7, py - 7);
  ctx.lineTo(px + w * 0.5 - 7, py + 3);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + w * 0.5, py - 1);
  ctx.lineTo(px + w * 0.5 + 7, py - 7);
  ctx.lineTo(px + w * 0.5 + 7, py + 3);
  ctx.closePath(); ctx.fill();
}

// ---- little drawing helpers ----
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function blob(cx, baseY, w, h) {
  ctx.beginPath();
  ctx.ellipse(cx, baseY, w / 2, h, 0, Math.PI, 0);
  ctx.fill();
}
function cloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 4, 22, 0, Math.PI * 2);
  ctx.arc(x + 44, y, 16, 0, Math.PI * 2);
  ctx.fill();
}
function drawHeart(x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(255,91,160,0.5)"; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y - s * 0.4, x - s, y - s * 0.4, x - s, y + s * 0.1);
  ctx.bezierCurveTo(x - s, y + s * 0.6, x, y + s * 0.9, x, y + s * 1.1);
  ctx.bezierCurveTo(x, y + s * 0.9, x + s, y + s * 0.6, x + s, y + s * 0.1);
  ctx.bezierCurveTo(x + s, y - s * 0.4, x, y - s * 0.4, x, y + s * 0.3);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------
//  GAME LOOP
// ---------------------------------------------------------
function loop() {
  if (!levelCleared) update();
  else updateParticles();   // keep confetti falling on the win screen
  draw();
  animationId = requestAnimationFrame(loop);
}
function startLoop() { if (animationId === null) animationId = requestAnimationFrame(loop); }
function stopLoop()  { if (animationId !== null) { cancelAnimationFrame(animationId); animationId = null; } }

// ---------------------------------------------------------
//  WIN A LEVEL
// ---------------------------------------------------------
function winLevel() {
  const level = LEVELS[levelIndex];
  const isLast = levelIndex === LEVELS.length - 1;
  const allCoins = collectedCoins === totalCoins;

  // confetti burst
  const colors = ["#ff6eac", "#ffd451", "#a67cff", "#7fd1ff", "#ff9ac8"];
  for (let i = 0; i < 80; i++) {
    confetti.push({
      x: W / 2, y: H / 2,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9 - 3,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  factDisplay.textContent = level.emoji + "  " + level.fact;

  if (isLast) {
    gameOverTitle.textContent = "You Finished! 🎉";
    gameOverMessage.textContent =
      "You cleared all 4 levels! One last secret: my favorite scents are vanilla & cedar. 🕯️ Thanks for playing!";
    nextLevelBtn.textContent = "Play Again ↻";
  } else {
    gameOverTitle.textContent = allCoins ? "Level Complete! ⭐ (All hearts!)" : "Level Complete! ⭐";
    gameOverMessage.textContent = level.fact;
    nextLevelBtn.textContent = "Next Level →";
  }
  gameOverScreen.style.display = "flex";
}

// ---------------------------------------------------------
//  BUTTONS + CONTROLS
// ---------------------------------------------------------
function openGame()  { gameModal.classList.add("active"); loadLevel(0); startLoop(); }
function closeGame() { gameModal.classList.remove("active"); stopLoop(); }

playGameBtn.addEventListener("click", openGame);
closeGameBtn.addEventListener("click", closeGame);
resetGameBtn.addEventListener("click", () => loadLevel(levelIndex));
nextLevelBtn.addEventListener("click", () => {
  loadLevel(levelIndex === LEVELS.length - 1 ? 0 : levelIndex + 1);
});

// click the dark area outside the game to close
gameModal.addEventListener("click", (e) => { if (e.target === gameModal) closeGame(); });

function tryJump() {
  if (player && (player.onGround || player.coyote > 0)) {
    player.vy = JUMP_POWER;
    player.onGround = false;
    player.coyote = 0;
    bounce = 6; // stretch up
  }
}

document.addEventListener("keydown", (e) => {
  if (!gameModal.classList.contains("active")) return;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
    e.preventDefault();
  }
  if ((e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") && !levelCleared) tryJump();
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
