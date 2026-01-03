/* ---------------------------------------------------
   MAIN TAB SWITCHING
--------------------------------------------------- */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* HOME → DEMONLIST BUTTON */
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
   GLOBAL STORAGE
--------------------------------------------------- */
let globalDemons = [];
let playerCountries = {};

/* ---------------------------------------------------
   LOAD PLAYER COUNTRIES
--------------------------------------------------- */
async function loadPlayerCountries() {
  try {
    playerCountries = await fetch("data/players.json").then(r => r.json());
  } catch (e) {
    console.warn("players.json missing or invalid");
    playerCountries = {};
  }
}

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

    globalDemons.forEach(demon => {
      container.appendChild(createDemonCard(demon));
    });

    setupSearchBar();
    loadLeaderboard();
  } catch (e) {
    console.error("Error loading demonlist:", e);
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
   DEMON CARD (CLICKABLE)
--------------------------------------------------- */
function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const img = document.createElement("img");
  img.src = getYoutubeThumbnail(demon.verification) || "fallback.png";

  const info = document.createElement("div");
  info.className = "demon-info";

  const creators = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : demon.creators || "Unknown";

  const score = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;
  const posLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  info.innerHTML = `
    <h2>${posLabel} — ${demon.name}</h2>
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

  const videoId = extractVideoID(demon.verification);

  container.innerHTML = `
    <button class="back-btn" onclick="goBackToList()">← Back to List</button>

    <h1>${posLabel} — ${demon.name}</h1>

    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${Array.isArray(demon.creators) ? demon.creators.join(", ") : demon.creators}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>

    <h2>Verification</h2>
    ${
      videoId
        ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
        : "<p>No verification video.</p>"
    }

    <h2>Records</h2>
    ${recordsHTML}
  `;
}

function goBackToList() {
  document.querySelector('.tab-btn[data-tab="demonlist"]').click();
}

/* ---------------------------------------------------
   LEADERBOARD (PLAYERS)
--------------------------------------------------- */
function loadLeaderboard() {
  const players = {};

  globalDemons.forEach(demon => {
    const score = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;

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

  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const country = playerCountries[p.name];
    const flag = country
      ? `<img class="flag" src="https://flagcdn.com/24x18/${country.toLowerCase()}.png">`
      : "";

    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player" data-player="${p.name}">
        ${flag} ${p.name}
      </span>
      <span>${p.score.toFixed(2)}</span>
    `;

    container.appendChild(row);
  });

  document.querySelectorAll(".clickable-player").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.dataset.player;
      showPlayerProfile(name, sorted.find(p => p.name === name));
    });
  });

  loadCountryLeaderboard(sorted);
}

/* ---------------------------------------------------
   COUNTRY LEADERBOARD
--------------------------------------------------- */
function loadCountryLeaderboard(sortedPlayers) {
  const countryScores = {};

  sortedPlayers.forEach(player => {
    const country = playerCountries[player.name];
    if (!country) return;

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

    const flag = `<img class="flag" src="https://flagcdn.com/24x18/${c.code.toLowerCase()}.png">`;

    row.innerHTML = `
      <span>${i + 1}</span>
      <span>${flag} ${c.code}</span>
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

  const country = playerCountries[name];
  const flag = country
    ? `<img class="flag" src="https://flagcdn.com/24x18/${country.toLowerCase()}.png">`
    : "";

  container.innerHTML = `
    <button class="back-btn" onclick="goBackToList()">← Back</button>
    <h2>${flag} ${name}</h2>
    <p><strong>Total score:</strong> ${playerData.score.toFixed(2)}</p>
    <h3>Records:</h3>
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
   SUB-TABS (Leaderboard internal tabs)
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

/* ---------------------------------------------------
   STARTUP
--------------------------------------------------- */
loadPlayerCountries();
loadDemonList();
loadModerators();
