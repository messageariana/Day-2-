// =========================
// THEME TOGGLE
// =========================

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("lavender-theme");

    const lavenderIsOn = document.body.classList.contains("lavender-theme");

    if (lavenderIsOn) {
      themeToggle.textContent = "Pink Mode";
    } else {
      themeToggle.textContent = "Lavender Mode";
    }

    createSparkleBurst(themeToggle);
  });
}

// =========================
// FAVORITE CARDS INTERACTION
// Only one card opens at a time
// =========================

const favoriteCards = document.querySelectorAll(".favorite-card");

favoriteCards.forEach((card) => {
  card.addEventListener("toggle", () => {
    if (card.open) {
      favoriteCards.forEach((otherCard) => {
        if (otherCard !== card) {
          otherCard.removeAttribute("open");
        }
      });
    }
  });

  const summary = card.querySelector("summary");

  if (summary) {
    summary.addEventListener("click", () => {
      createSparkleBurst(summary);
    });
  }
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
        if (entry.isIntersecting) {
          const contactLinks = entry.target.querySelectorAll(".contact-card p:nth-child(3), .contact-card p:nth-child(4)");
          contactLinks.forEach((link) => {
            link.classList.add("highlight-contact");
          });
        } else {
          const contactLinks = entry.target.querySelectorAll(".contact-card p");
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
  const sparkleSymbols = ["âœ¦", "â™¡", "âœ§", "âœ¿", "â‚ŠËš"];

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
