/* ---------------------------------------------------
   TAB SWITCHING
--------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

function openDemonlistFromHome() {
  document.querySelector('.tab-btn[data-tab="demonlist"]').click();
}

/* ---------------------------------------------------
   THEME TOGGLE
--------------------------------------------------- */
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
}

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
}

/* ---------------------------------------------------
   GLOBAL DATA
--------------------------------------------------- */
let globalDemons = [];
let globalDemonsMinus = [];
let playerProfiles = {};
let playerCountries = {};
let newDemons = [];
let badgeDefinitions = {};

/* ---------------------------------------------------
   COUNTRY NAMES
--------------------------------------------------- */
const COUNTRY_NAMES = {
  "IT": "Italy", "US": "United States", "DE": "Germany", "ES": "Spain",
  "GB": "United Kingdom", "NZ": "New Zealand", "RU": "Russia", "FR": "France",
  "CA": "Canada", "AU": "Australia", "BR": "Brazil", "SE": "Sweden",
  "NO": "Norway", "FI": "Finland", "NL": "Netherlands", "BE": "Belgium",
  "CH": "Switzerland", "AT": "Austria", "PL": "Poland", "PT": "Portugal",
  "MX": "Mexico", "JP": "Japan", "KR": "South Korea", "CN": "China",
  "IN": "India", "DK": "Denmark", "CZ": "Czech Republic", "SK": "Slovakia",
  "HU": "Hungary", "RO": "Romania", "BG": "Bulgaria", "GR": "Greece",
  "IE": "Ireland", "AR": "Argentina", "CL": "Chile", "ZA": "South Africa"
};

/* ---------------------------------------------------
   LOAD PLAYERS + DEFAULTS
--------------------------------------------------- */
async function loadPlayerCountries() {
  try {
    const raw = await fetch("data/players.json").then(r => r.json());
    playerProfiles = {};
    playerCountries = {};

    for (const name in raw) {
      const p = raw[name];
      const profile = typeof p === "string" ? { country: p } : p || {};

      playerProfiles[name] = {
        country: profile.country || "(no country)",
        bio: profile.bio || "(no bio)",
        social: profile.social || {},
        favorites: profile.favorites || [],
        badges: profile.badges || []
      };

      playerCountries[name] = playerProfiles[name].country;
    }
  } catch {
    playerProfiles = {};
    playerCountries = {};
  }
}

/* ---------------------------------------------------
   LOAD BADGE DEFINITIONS
--------------------------------------------------- */
async function loadBadgeDefinitions() {
  try {
    badgeDefinitions = await fetch("data/badges.json").then(r => r.json());
  } catch {
    badgeDefinitions = {};
  }
}

/* ---------------------------------------------------
   LOAD NEW DEMONS
--------------------------------------------------- */
async function loadNewDemons() {
  try {
    newDemons = await fetch("data/new.json").then(r => r.json());
  } catch {
    newDemons = [];
  }
}

/* ---------------------------------------------------
   LOAD DEMONLIST
--------------------------------------------------- */
/* ---------------------------------------------------
   LOAD DEMONLIST
--------------------------------------------------- */
async function loadDemonList() {
  try {
    const list = await fetch("data/list.json").then(r => r.json());
    const container = document.getElementById("demon-container");

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    globalDemons = demonFiles
      .map((d, i) => (d ? { ...d, position: i + 1 } : null))
      .filter(Boolean);

    // ⭐ MAKE DEMONLIST AVAILABLE TO DEMON CREATOR
    window.demonList = globalDemons;

    globalDemons.forEach(demon => {
      container.appendChild(createDemonCard(demon));
    });

    setupSearchBar();
    loadLeaderboard();
  } catch (e) {
    console.error("Error loading demonlist:", e);
  }
}

async function loadDemonListMinus() {
  try {
    const list = await fetch("data/list_minus.json").then(r => r.json());
    const container = document.getElementById("demon-container-2");

    const demonFiles = await Promise.all(
      list.map(id =>
        fetch(`data/demons/${id}.json`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    globalDemonsMinus = demonFiles
      .map((d, i) => (d ? { ...d, position: i + 1 } : null))
      .filter(Boolean);

    globalDemonsMinus.forEach(demon => {
      container.appendChild(createDemonCard(demon));
    });

  } catch (e) {
    console.error("Error loading minus list:", e);
  }
}


/* ---------------------------------------------------
   SEARCH BAR
--------------------------------------------------- */
function setupSearchBar() {
  const searchBar = document.getElementById("search-bar");
  if (!searchBar) return;

  searchBar.addEventListener("input", () => {
    const q = searchBar.value.toLowerCase();
    document.querySelectorAll("#demon-container .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(q) ? "flex" : "none";
    });
  });
}
// DROPDOWN TOGGLE LOGIC
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.dropdown;
    const dropdown = document.getElementById(`dropdown-${target}`);

    const isOpen = dropdown.style.display === "block";

    // Close all dropdowns
    document.querySelectorAll(".list-dropdown").forEach(d => d.style.display = "none");
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));

    // Toggle this one
    if (!isOpen) {
      dropdown.style.display = "block";
      btn.classList.add("active");
    }
  });
});

/* ---------------------------------------------------
   YOUTUBE HELPERS
--------------------------------------------------- */
function getYoutubeThumbnail(url) {
  if (!url) return null;
  try {
    if (url.includes("watch?v=")) {
      const id = new URL(url).searchParams.get("v");
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}

function extractVideoID(url) {
  try {
    if (url.includes("watch?v=")) return new URL(url).searchParams.get("v");
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
  } catch {}
  return null;
}

/* ---------------------------------------------------
   DEMON CARD
--------------------------------------------------- */
function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const img = document.createElement("img");
  img.src = getYoutubeThumbnail(demon.verification) || "https://via.placeholder.com/240x140?text=No+Preview";

  const info = document.createElement("div");
  info.className = "demon-info";

  const creators = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : demon.creators || "Unknown";

  const score = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;
  const posLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  const isNew =
    newDemons.includes(demon.name) ||
    newDemons.includes(demon.position) ||
    newDemons.includes(String(demon.position));

  const newBadge = isNew ? `<span class="new-badge">NEW</span>` : "";

  info.innerHTML = `
    <h2>${posLabel} — ${demon.name} ${newBadge}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creators}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
  `;

  card.appendChild(img);
  card.appendChild(info);

  card.addEventListener("click", () => openDemonPage(demon));

  return card;
}

/* ---------------------------------------------------
   DEMON PAGE
--------------------------------------------------- */
function openDemonPage(demon) {
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");

  const container = document.getElementById("demon-page-container");

  const score = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;
  const posLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  // -------------------------------
  // RECORDS
  // -------------------------------
  let recordsHTML = "";

  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      recordsHTML += `
        <div class="leaderboard-row">
          <span>${r.user}</span>
          <span>${r.percent}%</span>
          <span>${r.hz || ""}</span>
          ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
        </div>
      `;
    });
  } else {
    recordsHTML = "<p>No records yet.</p>";
  }

  // -------------------------------
  // HISTORY (safe fallback)
  // -------------------------------
  const historyHTML =
    demon.history && Array.isArray(demon.history) && demon.history.length > 0
      ? demon.history
          .map((pos, i) => `<div class="history-row">Update ${i + 1}: #${pos}</div>`)
          .join("")
      : "<div class='history-row'>No history available</div>";

  // -------------------------------
  // VIDEO EMBED (centered)
  // -------------------------------
  const videoId = extractVideoID(demon.verification);

  const videoHTML = videoId
    ? `
      <div class="video-wrapper">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}"
          allowfullscreen>
        </iframe>
      </div>
    `
    : "<p>No verification video.</p>";

  // -------------------------------
  // PAGE CONTENT
  // -------------------------------
  container.innerHTML = `
    <button class="back-btn" onclick="goBackToList()">← Back to List</button>

    <div class="center-block">
      <h1 class="demon-title">${posLabel} — ${demon.name}</h1>
      <h2>Verification</h2>
      ${videoHTML}
    </div>

    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${Array.isArray(demon.creators) ? demon.creators.join(", ") : demon.creators}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>

    <h2>Position History</h2>
    <div class="history-box">
      ${historyHTML}
    </div>

    <h2>Records</h2>
    ${recordsHTML}
  `;
}



/* ---------------------------------------------------
   MINI BADGES (LEADERBOARD)
--------------------------------------------------- */
function renderMiniBadges(name) {
  const profile = playerProfiles[name];
  if (!profile || !profile.badges) return "";

  return profile.badges
    .map(b => {
      const def = badgeDefinitions[b];
      if (!def) return "";
      return `<img src="${def.image}" class="mini-badge">`;
    })
    .join("");
}

/* ---------------------------------------------------
   FULL BADGES (PROFILE)
--------------------------------------------------- */
function renderFullBadges(name) {
  const profile = playerProfiles[name];
  if (!profile || !profile.badges) return "";

  return profile.badges
    .map(b => {
      const def = badgeDefinitions[b];
      if (!def) return "";
      return `
        <div class="full-badge">
          <img src="${def.image}" class="badge-icon">
          <div class="badge-text">
            <strong>${def.title}</strong><br>
            <em>${def.description}</em>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ---------------------------------------------------
   LEADERBOARD (PLAYERS)
--------------------------------------------------- */
function loadLeaderboard() {
  const players = {};

  // Calculate player scores
  globalDemons.forEach(demon => {
    const score = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;

    // Verifier gets full score
    if (demon.verifier && demon.verifier !== "Not beaten yet") {
      const name = demon.verifier;
      if (!players[name]) players[name] = { score: 0, records: [] };

      players[name].score += score;
      players[name].records.push({
        demon: demon.name,
        position: demon.position,
        percent: 100,
        link: demon.verification,
        type: "Verification"
      });
    }

    // Records
    if (Array.isArray(demon.records)) {
      demon.records.forEach(r => {
        if (r.user === "Not beaten yet") return;

        const name = r.user;
        const gain = score * (r.percent / 100);

        if (!players[name]) players[name] = { score: 0, records: [] };

        players[name].score += gain;
        players[name].records.push({
          demon: demon.name,
          position: demon.position,
          percent: r.percent,
          link: r.link,
          type: "Record"
        });
      });
    }
  });

  // Sort players
  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  // Automatic badges BEFORE rendering leaderboard
  applyAutomaticBadges(sorted);

  // Render leaderboard
  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const country = playerCountries[p.name];
    const flag = COUNTRY_NAMES[country]
      ? `<img class="flag" src="https://flagcdn.com/24x18/${country.toLowerCase()}.png">`
      : "";

    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player" data-player="${p.name}">
        ${flag} ${p.name} ${renderMiniBadges(p.name)}
      </span>
      <span>${p.score.toFixed(2)}</span>
    `;

    container.appendChild(row);
  });

  // Clickable profiles
  document.querySelectorAll(".clickable-player").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      showPlayerProfile(name, sorted.find(p => p.name === name));
    });
  });

  // Country leaderboard
  loadCountryLeaderboard(sorted);
}

/* ---------------------------------------------------
   AUTOMATIC BADGES
--------------------------------------------------- */
function applyAutomaticBadges(sortedPlayers) {
  // Remove all automatic badges first
  Object.values(playerProfiles).forEach(profile => {
    if (!profile.badges) profile.badges = [];
    profile.badges = profile.badges.filter(b =>
      b !== "gamer" &&
      b !== "top1_current" &&
      b !== "top1_victor"
    );
  });

  /* Gamer badge (≥ 0.1 points) */
  sortedPlayers.forEach(p => {
    if (p.score >= 0.1) {
      const profile = playerProfiles[p.name];
      if (profile && !profile.badges.includes("gamer")) {
        profile.badges.push("gamer");
      }
    }
  });

  /* Current Top 1 Player badge */
  if (sortedPlayers.length > 0) {
    const top1Player = sortedPlayers[0].name;
    const profile = playerProfiles[top1Player];
    if (profile && !profile.badges.includes("top1_current")) {
      profile.badges.push("top1_current");
    }
  }

  /* Top 1 Demon Victor badge */
  const top1Demon = globalDemons.find(d => d.position === 1);

  if (top1Demon) {
    // Verifier
    if (top1Demon.verifier) {
      const profile = playerProfiles[top1Demon.verifier];
      if (profile && !profile.badges.includes("top1_victor")) {
        profile.badges.push("top1_victor");
      }
    }

    // Anyone with 100%
    if (Array.isArray(top1Demon.records)) {
      top1Demon.records.forEach(r => {
        if (r.percent === 100) {
          const profile = playerProfiles[r.user];
          if (profile && !profile.badges.includes("top1_victor")) {
            profile.badges.push("top1_victor");
          }
        }
      });
    }
  }
}

/* ---------------------------------------------------
   COUNTRY LEADERBOARD
--------------------------------------------------- */
function loadCountryLeaderboard(sortedPlayers) {
  const countryScores = {};

  sortedPlayers.forEach(player => {
    const country = playerCountries[player.name];
    if (!country || country === "(no country)") return;

    if (!countryScores[country]) {
      countryScores[country] = 0;
    }

    countryScores[country] += player.score;
  });

  const sortedCountries = Object.entries(countryScores)
    .map(([code, score]) => ({ code, score }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("leaderboard-countries");
  container.innerHTML = "";

  sortedCountries.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const flag = COUNTRY_NAMES[c.code]
      ? `<img class="flag" src="https://flagcdn.com/24x18/${c.code.toLowerCase()}.png">`
      : "";

    const fullName = COUNTRY_NAMES[c.code] || c.code;

    row.innerHTML = `
      <span>${i + 1}</span>
      <span>${flag} ${fullName}</span>
      <span>${c.score.toFixed(2)}</span>
    `;

    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   PLAYER PROFILE
--------------------------------------------------- */
function showPlayerProfile(name, playerData) {
  if (!playerData) return;

document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
document.getElementById("profile").classList.add("active");

const container = document.getElementById("profile-container");

  const profile = playerProfiles[name] || {
    country: "(no country)",
    bio: "(no bio)",
    social: {},
    favorites: [],
    badges: []
  };

  const country = profile.country;
  const flag = COUNTRY_NAMES[country]
    ? `<img class="flag" src="https://flagcdn.com/24x18/${country.toLowerCase()}.png">`
    : "";

  const bio = profile.bio || "(no bio)";
  const socials = profile.social || {};
  const favorites = profile.favorites || [];

  container.innerHTML = `
    <button class="back-btn" onclick="goBackToList()">← Back</button>
    <h2>${flag} ${name}</h2>
    <p><strong>Total score:</strong> ${playerData.score.toFixed(2)}</p>

    <h3>Badges</h3>
    <div class="badge-container">
      ${renderFullBadges(name) || "<p>(no badges)</p>"}
    </div>

    <h3>Bio</h3>
    <p>${bio}</p>

    <h3>Social Links</h3>
    <p>
      ${socials.youtube ? `<a href="${socials.youtube}" target="_blank">YouTube</a><br>` : "(no YouTube)<br>"}
      ${socials.twitter ? `<a href="${socials.twitter}" target="_blank">Twitter</a><br>` : "(no Twitter)<br>"}
      ${socials.twitch ? `<a href="${socials.twitch}" target="_blank">Twitch</a><br>` : "(no Twitch)<br>"}
    </p>

    <h3>Favorite Demons</h3>
    <ul>
      ${
        favorites.length > 0
          ? favorites.map(f => `<li>${f}</li>`).join("")
          : "<li>(no favorites)</li>"
      }
    </ul>

    <h3>Records</h3>
  `;

  const records = [...playerData.records].sort((a, b) => a.position - b.position);

  records.forEach(r => {
    const div = document.createElement("div");
    div.className = "leaderboard-row";

    const posLabel = r.position > 75 ? "Legacy" : "#" + r.position;
    const typeLabel = r.type === "Verification" ? "(Verification)" : "";

    div.innerHTML = `
      <span>${posLabel}</span>
      <span>${r.demon}</span>
      <span>${r.percent ? r.percent + "%" : ""} ${typeLabel}</span>
      ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
    `;

    container.appendChild(div);
  });
}
/* ---------------------------------------------------
   SUBTABS (LEADERBOARD)
--------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.subtab;

      document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".subtab-content").forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });
});

/* ---------------------------------------------------
   MODERATORS
--------------------------------------------------- */
function loadModerators() {
  const container = document.getElementById("moderators-container");

  const mods = [
    { name: "UniverDemonlist", role: "Super Moderator" },
    { name: "PowerGreen", role: "Moderator" },
    { name: "Prometheus", role: "Developer" }
  ];

  mods.forEach(mod => {
    const row = document.createElement("div");
    row.className = "moderator-row";

    row.innerHTML = `
      <span>${mod.name}</span>
      <span class="moderator-role">${mod.role}</span>
    `;

    container.appendChild(row);
  });
}
function buildListDropdowns() {
  const main = document.getElementById("dropdown-main");
  const extended = document.getElementById("dropdown-extended");
  const legacy = document.getElementById("dropdown-legacy");

  main.innerHTML = "";
  extended.innerHTML = "";
  legacy.innerHTML = "";

  globalDemons.forEach(demon => {
    const pos = demon.position;

    const link = document.createElement("a");
    link.textContent = `#${pos} — ${demon.name}`;
    link.href = "javascript:void(0)";
    link.addEventListener("click", () => openDemonPage(demon));

    if (pos <= 30) main.appendChild(link);
    else if (pos <= 75) extended.appendChild(link);
    else legacy.appendChild(link);
  });
}

/* ---------------------------------------------------
   STARTUP
--------------------------------------------------- */
loadPlayerCountries();
loadBadgeDefinitions();
loadNewDemons();
loadDemonList().then(buildListDropdowns);
loadDemonListMinus();
loadModerators();

function dc_generate() {
  // Use the demonlist already loaded by your site
  const existingList = window.demonList ? [...window.demonList] : [];

  if (!existingList.length) {
    alert("Your demonlist is not loaded yet.");
    return;
  }

  const newDemon = {
    id: Number(document.getElementById("dc-id").value),
    name: document.getElementById("dc-name").value,
    author: document.getElementById("dc-author").value,
    creators: document.getElementById("dc-creators").value.split(",").map(s => s.trim()),
    verifier: document.getElementById("dc-verifier").value,
    verification: document.getElementById("dc-verification").value,
    percentToQualify: Number(document.getElementById("dc-percent").value),
    password: document.getElementById("dc-password").value,
    records: []
  };

  const placement = Number(document.getElementById("dc-placement").value);

  // Insert into list
  existingList.splice(placement - 1, 0, newDemon);

  // Recalculate positions
  existingList.forEach((d, i) => d.position = i + 1);

  // Output 1: the demon template
  document.getElementById("dc-new-demon").textContent =
    JSON.stringify(newDemon, null, 4);

  // Output 2: the updated list.json
  document.getElementById("dc-updated-list").textContent =
    JSON.stringify(existingList, null, 4);
}



















