// Game Constants
const CARD_PAIRS = [
  "🍕", "🍕",
  "🍔", "🍔",
  "🍟", "🍟",
  "🌭", "🌭",
  "🍿", "🍿",
  "🥤", "🥤",
  "🍪", "🍪",
  "🎂", "🎂"
];

// Game State
let gameBoard = document.getElementById("gameBoard");
let cards = [];
let flipped = [];
let matched = [];
let moves = 0;
let pairs = 0;
let isProcessing = false;

// DOM Elements
const movesDisplay = document.getElementById("moves");
const pairsDisplay = document.getElementById("pairs");
const resetBtn = document.getElementById("resetBtn");
const winModal = document.getElementById("winModal");
const playAgainBtn = document.getElementById("playAgainBtn");
const finalStatsDisplay = document.getElementById("finalStats");

// Initialize the game
function init() {
  moves = 0;
  pairs = 0;
  flipped = [];
  matched = [];
  isProcessing = false;
  
  movesDisplay.textContent = "0";
  pairsDisplay.textContent = "0";
  winModal.classList.remove("show");
  
  // Shuffle and shuffle the cards
  const shuffled = CARD_PAIRS.sort(() => Math.random() - 0.5);
  
  // Create card elements
  gameBoard.innerHTML = "";
  cards = [];
  
  shuffled.forEach((emoji, index) => {
    const card = document.createElement("button");
    card.className = "card";
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    card.textContent = "?";
    
    card.addEventListener("click", flipCard);
    gameBoard.appendChild(card);
    cards.push(card);
  });
}

// Flip a card
function flipCard(e) {
  const card = e.target;
  
  // Prevent clicking if already flipped, matched, or processing
  if (
    flipped.includes(card) ||
    matched.includes(card) ||
    isProcessing ||
    card === flipped[0]
  ) {
    return;
  }
  
  // Flip the card
  card.textContent = card.dataset.emoji;
  card.classList.add("flipped");
  flipped.push(card);
  
  // Check if we have two flipped cards
  if (flipped.length === 2) {
    checkMatch();
  }
}

// Check if two flipped cards match
function checkMatch() {
  isProcessing = true;
  moves++;
  movesDisplay.textContent = moves;
  
  const [card1, card2] = flipped;
  const isMatch = card1.dataset.emoji === card2.dataset.emoji;
  
  if (isMatch) {
    // Match found!
    pairs++;
    pairsDisplay.textContent = pairs;
    
    card1.classList.add("matched");
    card2.classList.add("matched");
    
    matched.push(card1, card2);
    flipped = [];
    isProcessing = false;
    
    // Check if game is won
    if (matched.length === CARD_PAIRS.length) {
      setTimeout(showWinModal, 300);
    }
  } else {
    // No match - flip cards back
    setTimeout(() => {
      card1.textContent = "?";
      card2.textContent = "?";
      card1.classList.remove("flipped");
      card2.classList.remove("flipped");
      flipped = [];
      isProcessing = false;
    }, 1000);
  }
}

// Show win modal
function showWinModal() {
  finalStatsDisplay.textContent = `You completed the game in ${moves} moves and found ${pairs} pairs!`;
  winModal.classList.add("show");
}

// Reset the game
function resetGame() {
  init();
}

// Event listeners
resetBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

// Start the game on page load
init();
        }
      });
    }
  });

  const summary = card.querySelector("summary");

  summary.addEventListener("click", () => {
    createSparkleBurst(summary);
  });
});

// =========================
// SCROLL REVEAL ANIMATION
// Sections fade in when you scroll
// =========================

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.18
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

// =========================
// CONTACT SECTION HIGHLIGHT
// Highlight contact info when contact section is revealed
// =========================

const contactSection = document.getElementById("contact");
if (contactSection) {
  const contactObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const contactLinks = entry.target.querySelectorAll(".contact-card p:nth-child(3), .contact-card p:nth-child(4)");
        if (entry.isIntersecting) {
          contactLinks.forEach((link) => {
            link.classList.add("highlight-contact");
          });
        } else {
          contactLinks.forEach((link) => {
            link.classList.remove("highlight-contact");
          });
        }
      });
    },
    {
      threshold: 0.3
    }
  );
  contactObserver.observe(contactSection);
}

// =========================
// SPARKLE BURST FUNCTION
// =========================

function createSparkleBurst(element) {
  const sparkleSymbols = ["✦", "♡", "✧", "✿", "₊˚"];

  const rect = element.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const sparkle = document.createElement("span");

    sparkle.classList.add("burst-sparkle");
    sparkle.textContent = sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];

    const angle = Math.random() * Math.PI * 2;
    const distance = 45 + Math.random() * 55;

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    sparkle.style.left = `${startX}px`;
    sparkle.style.top = `${startY}px`;
    sparkle.style.setProperty("--spark-x", `${moveX}px`);
    sparkle.style.setProperty("--spark-y", `${moveY}px`);

    document.body.appendChild(sparkle);

    setTimeout(() => {
      sparkle.remove();
    }, 800);
  }
}