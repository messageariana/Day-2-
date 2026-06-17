// =========================
// ADVANCED PLATFORMER GAME - PROFESSIONAL GRAPHICS
// =========================

const playGameBtn = document.getElementById("playGameBtn");
const gameModal = document.getElementById("gameModal");
const closeGameBtn = document.getElementById("closeGameBtn");
const resetGameBtn = document.getElementById("resetGameBtn");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

// Game facts for each level
const gameFacts = [
  "🎂 I was born on July 17, 2013!",
  "👩‍👩‍🧒 I have one older sister!",
  "🏫 I go to Blach Intermediate!",
  "👯 My bestest friends are OLIVIA/CATALINA and EMMY/AN-YING!"
];

// Game state
let currentLevel = 1;
let gameActive = false;
let coins = 0;
let checkpointReached = false;

// Advanced player object
const player = {
  x: 50,
  y: 300,
  width: 24,
  height: 32,
  velocityY: 0,
  velocityX: 0,
  isJumping: false,
  coyoteCounter: 0,
  coyoteTime: 4,
  speed: 6,
  jumpPower: 11.5,
  color: "#ff70ab",
  maxFallSpeed: 16,
  doubleJumpUsed: false,
  facingRight: true,
  bouncingY: 0
};

// Input handling
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Platform with advanced mechanics
class Platform {
  constructor(x, y, width, height, type = "normal", isCheckpoint = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.isCheckpoint = isCheckpoint;
    this.startX = x;
    this.moveSpeed = 2;
    this.moveProgress = 0;
    this.isFalling = false;
    this.angle = 0;
    this.centerX = x + width / 2;
    this.centerY = y + height / 2;
    this.conveyorSpeed = 3;
    this.glow = 0;
  }

  update() {
    if (this.type === "moving") {
      this.moveProgress += this.moveSpeed;
      if (this.moveProgress > 200) this.moveSpeed *= -1;
      if (this.moveProgress < 0) this.moveSpeed *= -1;
      this.x = this.startX + this.moveProgress;
      this.centerX = this.x + this.width / 2;
    }
    if (this.type === "falling" && this.isFalling) {
      this.y += 8;
    }
    if (this.type === "rotating") {
      this.angle += 2;
    }
    if (this.isCheckpoint) {
      this.glow += 2;
    }
  }

  draw() {
    ctx.save();
    
    // Checkpoint glow effect
    if (this.isCheckpoint) {
      const glowSize = Math.sin(this.glow * Math.PI / 180) * 8 + 8;
      ctx.fillStyle = `rgba(255, 112, 171, ${0.2 + Math.sin(this.glow * Math.PI / 180) * 0.2})`;
      ctx.fillRect(this.x - glowSize, this.y - glowSize, this.width + glowSize * 2, this.height + glowSize * 2);
    }

    if (this.type === "rotating") {
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate((this.angle * Math.PI) / 180);
      ctx.fillStyle = "#ffb3d9";
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.strokeStyle = "#ff70ab";
      ctx.lineWidth = 3;
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      const color = this.isCheckpoint ? "#ff85c1" : "#ffc7e1";
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = "#ff70ab";
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      
      // Conveyor pattern
      if (this.type === "conveyor") {
        ctx.strokeStyle = "rgba(255, 112, 171, 0.6)";
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 18) {
          ctx.beginPath();
          ctx.moveTo(this.x + i, this.y + 8);
          ctx.lineTo(this.x + i + 10, this.height + this.y - 8);
          ctx.stroke();
        }
      }
    }
    
    // Draw checkpoint symbol
    if (this.isCheckpoint) {
      ctx.fillStyle = "#ff70ab";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐", this.x + this.width / 2, this.y + this.height / 2);
    }
    
    ctx.restore();
  }

  collidesWith(rect) {
    return !(rect.x + rect.width <= this.x ||
             rect.x >= this.x + this.width ||
             rect.y + rect.height <= this.y ||
             rect.y >= this.y + this.height);
  }

  triggerFall() {
    if (this.type === "falling" && !this.isFalling) {
      this.isFalling = true;
    }
  }
}

// Spike obstacle
class Spike {
  constructor(x, y, width = 22, height = 26) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#cc0000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  collidesWith(rect) {
    return !(rect.x + rect.width <= this.x ||
             rect.x >= this.x + this.width ||
             rect.y + rect.height <= this.y ||
             rect.y >= this.y + this.height);
  }
}

// Smart enemy with AI
class Enemy {
  constructor(x, y, width, height, minX, maxX, speed = 2) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.minX = minX;
    this.maxX = maxX;
    this.speed = speed;
    this.direction = 1;
    this.chasing = false;
    this.chaseRange = 200;
  }

  update(playerX) {
    const distToPlayer = Math.abs(playerX - (this.x + this.width / 2));
    if (distToPlayer < this.chaseRange) {
      this.chasing = true;
      this.speed = 4;
      this.direction = playerX > (this.x + this.width / 2) ? 1 : -1;
    } else {
      this.chasing = false;
      this.speed = 2;
    }

    this.x += this.speed * this.direction;
    if (this.x <= this.minX || this.x >= this.maxX) {
      this.direction *= -1;
    }
  }

  draw() {
    const color = this.chasing ? "#ff6600" : "#ffdd00";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.chasing ? "#cc3300" : "#ff9900";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "black";
    const eyeSize = this.chasing ? 6 : 5;
    ctx.beginPath();
    ctx.arc(this.x + 7, this.y + 8, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + this.width - 7, this.y + 8, eyeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  collidesWith(rect) {
    return !(rect.x + rect.width <= this.x ||
             rect.x >= this.x + this.width ||
             rect.y + rect.height <= this.y ||
             rect.y >= this.y + this.height);
  }
}

// Collectible coin
class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.collected = false;
    this.rotation = 0;
  }

  update() {
    this.rotation += 6;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = "#ffdd00";
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  collidesWith(rect) {
    return !(rect.x + rect.width <= this.x ||
             rect.x >= this.x + this.width ||
             rect.y + rect.height <= this.y ||
             rect.y >= this.y + this.height);
  }
}

// Complex level definitions
const levels = [
  {
    platforms: [
      new Platform(0, 470, 800, 30, "normal"),
      new Platform(80, 410, 60, 16, "normal"),
      new Platform(180, 370, 70, 16, "conveyor"),
      new Platform(310, 330, 80, 16, "normal"),
      new Platform(450, 280, 100, 16, "moving"),
      new Platform(600, 240, 70, 16, "normal"),
      new Platform(730, 180, 70, 16, "normal", true)
    ],
    spikes: [
      new Spike(140, 450),
      new Spike(260, 390),
      new Spike(380, 350)
    ],
    enemies: [
      new Enemy(200, 380, 28, 20, 160, 280, 2)
    ],
    coins: [
      new Coin(100, 380),
      new Coin(350, 300),
      new Coin(550, 200)
    ]
  },
  {
    platforms: [
      new Platform(0, 470, 800, 30, "normal"),
      new Platform(50, 415, 55, 16, "normal"),
      new Platform(140, 385, 55, 16, "falling"),
      new Platform(240, 345, 55, 16, "normal"),
      new Platform(330, 370, 60, 16, "conveyor"),
      new Platform(450, 310, 60, 16, "rotating"),
      new Platform(570, 280, 60, 16, "normal"),
      new Platform(680, 330, 60, 16, "moving"),
      new Platform(750, 200, 50, 16, "normal", true)
    ],
    spikes: [
      new Spike(130, 450),
      new Spike(190, 410),
      new Spike(310, 370),
      new Spike(420, 340),
      new Spike(650, 360)
    ],
    enemies: [
      new Enemy(250, 320, 28, 20, 200, 350, 2),
      new Enemy(500, 300, 28, 20, 450, 600, 2.5)
    ],
    coins: [
      new Coin(160, 350),
      new Coin(310, 320),
      new Coin(480, 270),
      new Coin(700, 290)
    ]
  },
  {
    platforms: [
      new Platform(0, 470, 800, 30, "normal"),
      new Platform(70, 420, 50, 16, "normal"),
      new Platform(160, 390, 55, 16, "conveyor"),
      new Platform(70, 350, 50, 16, "moving"),
      new Platform(200, 320, 55, 16, "falling"),
      new Platform(310, 370, 60, 16, "rotating"),
      new Platform(430, 310, 55, 16, "normal"),
      new Platform(310, 260, 55, 16, "normal"),
      new Platform(520, 340, 60, 16, "conveyor"),
      new Platform(650, 290, 55, 16, "normal"),
      new Platform(740, 380, 60, 16, "moving"),
      new Platform(770, 210, 30, 16, "normal", true)
    ],
    spikes: [
      new Spike(130, 450),
      new Spike(190, 400),
      new Spike(150, 365),
      new Spike(260, 350),
      new Spike(380, 355),
      new Spike(480, 325),
      new Spike(600, 360),
      new Spike(700, 410)
    ],
    enemies: [
      new Enemy(210, 300, 28, 20, 160, 300, 2),
      new Enemy(450, 290, 28, 20, 400, 550, 2.5),
      new Enemy(650, 340, 28, 20, 600, 750, 2)
    ],
    coins: [
      new Coin(120, 360),
      new Coin(240, 280),
      new Coin(360, 330),
      new Coin(520, 310),
      new Coin(700, 250)
    ]
  },
  {
    platforms: [
      new Platform(0, 470, 800, 30, "normal"),
      new Platform(60, 420, 48, 16, "normal"),
      new Platform(140, 390, 50, 16, "falling"),
      new Platform(70, 350, 48, 16, "conveyor"),
      new Platform(190, 320, 52, 16, "moving"),
      new Platform(300, 370, 55, 16, "rotating"),
      new Platform(400, 310, 52, 16, "normal"),
      new Platform(280, 250, 50, 16, "falling"),
      new Platform(490, 340, 58, 16, "conveyor"),
      new Platform(600, 290, 55, 16, "normal"),
      new Platform(310, 190, 50, 16, "normal"),
      new Platform(710, 360, 55, 16, "moving"),
      new Platform(750, 220, 50, 16, "normal"),
      new Platform(780, 140, 20, 16, "normal", true)
    ],
    spikes: [
      new Spike(120, 450),
      new Spike(180, 410),
      new Spike(140, 365),
      new Spike(230, 350),
      new Spike(160, 295),
      new Spike(350, 350),
      new Spike(450, 360),
      new Spike(540, 360),
      new Spike(600, 305),
      new Spike(680, 360),
      new Spike(740, 310)
    ],
    enemies: [
      new Enemy(200, 300, 28, 20, 150, 320, 2),
      new Enemy(420, 290, 28, 20, 380, 530, 2.5),
      new Enemy(620, 340, 28, 20, 570, 720, 2),
      new Enemy(360, 170, 28, 20, 310, 410, 2)
    ],
    coins: [
      new Coin(100, 360),
      new Coin(220, 280),
      new Coin(360, 330),
      new Coin(490, 320),
      new Coin(640, 250),
      new Coin(350, 160)
    ]
  }
];

let currentPlatforms = [];
let currentSpikes = [];
let currentEnemies = [];
let currentCoins = [];

function initLevel(levelNum) {
  currentLevel = levelNum;
  const levelData = levels[levelNum - 1];
  
  // Create fresh platform instances
  currentPlatforms = levelData.platforms.map(p => new Platform(p.x, p.y, p.width, p.height, p.type, p.isCheckpoint));
  currentSpikes = levelData.spikes;
  currentEnemies = levelData.enemies;
  currentCoins = levelData.coins;
  checkpointReached = false;
  
  player.x = 50;
  player.y = 300;
  player.velocityY = 0;
  player.velocityX = 0;
  player.isJumping = false;
  player.doubleJumpUsed = false;
  player.coyoteCounter = 0;
  coins = 0;

  document.getElementById("levelNumber").textContent = currentLevel;
  document.getElementById("factDisplay").textContent = "";

  gameActive = true;
  gameLoop();
}

function updatePlayerMovement() {
  if (player.coyoteCounter > 0) player.coyoteCounter--;

  // Horizontal movement
  if (keys["ArrowLeft"]) {
    player.velocityX = -player.speed;
    player.facingRight = false;
  } else if (keys["ArrowRight"]) {
    player.velocityX = player.speed;
    player.facingRight = true;
  } else {
    player.velocityX *= 0.88;
  }

  player.x += player.velocityX;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > 800) player.x = 800 - player.width;

  // Gravity
  player.velocityY += 0.72;
  if (player.velocityY > player.maxFallSpeed) {
    player.velocityY = player.maxFallSpeed;
  }
  player.y += player.velocityY;

  // Jumping with coyote time and double jump
  if ((keys[" "] || keys["ArrowUp"]) && !player.isJumping) {
    if (player.coyoteCounter > 0) {
      player.velocityY = -player.jumpPower;
      player.isJumping = true;
      player.coyoteCounter = 0;
      player.doubleJumpUsed = false;
    } else if (!player.doubleJumpUsed && player.velocityY > 0) {
      player.velocityY = -player.jumpPower * 0.85;
      player.doubleJumpUsed = true;
    }
  }

  // Platform collisions
  for (let i = 0; i < currentPlatforms.length; i++) {
    const platform = currentPlatforms[i];
    if (platform.collidesWith(player)) {
      if (player.velocityY >= 0 && 
          player.y + player.height - player.velocityY <= platform.y + 5) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
        player.coyoteCounter = player.coyoteTime;
        player.doubleJumpUsed = false;

        if (platform.type === "conveyor") {
          player.velocityX += (platform.conveyorSpeed * 0.5);
        }

        if (platform.type === "falling") {
          platform.triggerFall();
        }

        if (platform.isCheckpoint && !checkpointReached) {
          checkpointReached = true;
          showGameOver(true);
          return;
        }
      }
    }
  }

  // Spike collisions
  for (let i = 0; i < currentSpikes.length; i++) {
    if (currentSpikes[i].collidesWith(player)) {
      die();
      return;
    }
  }

  // Enemy collisions
  for (let i = 0; i < currentEnemies.length; i++) {
    if (currentEnemies[i].collidesWith(player)) {
      die();
      return;
    }
  }

  // Coin collection
  for (let i = 0; i < currentCoins.length; i++) {
    const coin = currentCoins[i];
    if (!coin.collected && coin.collidesWith(player)) {
      coin.collected = true;
      coins++;
    }
  }

  // Fall off world
  if (player.y > 520) {
    die();
    return;
  }
}

function die() {
  gameActive = false;
  showGameOver(false);
}

function drawGame() {
  // Sky background
  const gradient = ctx.createLinearGradient(0, 0, 0, 500);
  gradient.addColorStop(0, "#e0d5ff");
  gradient.addColorStop(1, "#fff0ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 500);

  // Update and draw platforms
  for (let i = 0; i < currentPlatforms.length; i++) {
    currentPlatforms[i].update();
    currentPlatforms[i].draw();
  }

  // Draw spikes
  for (let i = 0; i < currentSpikes.length; i++) {
    currentSpikes[i].draw();
  }

  // Update and draw enemies
  for (let i = 0; i < currentEnemies.length; i++) {
    currentEnemies[i].update(player.x + player.width / 2);
    currentEnemies[i].draw();
  }

  // Update and draw coins
  for (let i = 0; i < currentCoins.length; i++) {
    if (!currentCoins[i].collected) {
      currentCoins[i].update();
      currentCoins[i].draw();
    }
  }

  // Draw player with better graphics
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = "#ff4da8";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw cute eyes
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(player.x + 7, player.y + 10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x + player.width - 7, player.y + 10, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(player.x + 7, player.y + 10, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x + player.width - 7, player.y + 10, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw coin counter
  ctx.fillStyle = "#ff70ab";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`💰 Coins: ${coins}`, 15, 30);

  // Draw level
  ctx.fillStyle = "#333";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`Level ${currentLevel}/4`, 785, 30);
}

function gameLoop() {
  if (!gameActive) return;

  updatePlayerMovement();
  drawGame();

  requestAnimationFrame(gameLoop);
}

function showGameOver(isComplete) {
  gameActive = false;
  const gameOverScreen = document.getElementById("gameOver");
  const gameOverTitle = document.getElementById("gameOverTitle");
  const gameOverMessage = document.getElementById("gameOverMessage");
  const nextLevelBtn = document.getElementById("nextLevelBtn");

  if (isComplete) {
    gameOverTitle.textContent = "⭐ CHECKPOINT REACHED! ⭐";
    document.getElementById("factDisplay").textContent = gameFacts[currentLevel - 1];
    gameOverMessage.textContent = `${gameFacts[currentLevel - 1]}\n\nCoins: ${coins}`;

    if (currentLevel < 4) {
      nextLevelBtn.textContent = "→ Next Level";
      nextLevelBtn.onclick = () => {
        gameOverScreen.style.display = "none";
        initLevel(currentLevel + 1);
      };
    } else {
      nextLevelBtn.textContent = "🌟 Game Complete! 🌟";
      nextLevelBtn.onclick = () => {
        closeGame();
      };
    }
  } else {
    gameOverTitle.textContent = "☠️ YOU DIED! ☠️";
    gameOverMessage.textContent = "⬅️ ➡️ = Move | SPACE = Jump\nDouble Jump + Avoid Spikes!";
    nextLevelBtn.textContent = "Try Again";
    nextLevelBtn.onclick = () => {
      gameOverScreen.style.display = "none";
      initLevel(currentLevel);
    };
  }

  gameOverScreen.style.display = "block";
}

function openGame() {
  window.scrollTo(0, 0);
  gameModal.classList.add("active");
  createSparkleBurst(playGameBtn);
  setTimeout(() => {
    initLevel(1);
  }, 100);
}

function closeGame() {
  gameModal.classList.remove("active");
  document.getElementById("gameOver").style.display = "none";
  gameActive = false;
}

// Event listeners
playGameBtn.addEventListener("click", openGame);
closeGameBtn.addEventListener("click", closeGame);
resetGameBtn.addEventListener("click", () => {
  document.getElementById("gameOver").style.display = "none";
  initLevel(currentLevel);
});
