/* ---------------------------------------------------
   TAB SWITCHING
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
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  document.querySelector('.tab-btn[data-tab="demonlist"]').classList.add("active");
  document.getElementById("demonlist").classList.add("active");
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
   GLOBAL DEMON STORAGE
--------------------------------------------------- */
let globalDemons = [];
let minusDemons = [];

/* ---------------------------------------------------
   LOAD MAIN DEMONLIST
--------------------------------------------------- */
async function loadDemonList() {
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
    const card = createDemonCard(demon);
    container.appendChild(card);
  });

  setupSearchBar();
  loadLeaderboard();
}

/* ---------------------------------------------------
   LOAD DEMONLIST -
--------------------------------------------------- */
async function loadDemonListMinus() {
  const list = await fetch("data/list_minus.json").then(r => r.json());
  const container = document.getElementById("demon-container-minus");

  const demonFiles = await Promise.all(
    list.map(id =>
      fetch(`data/demons/${id}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  minusDemons = demonFiles.filter(Boolean);

  minusDemons.forEach(demon => {
    const card = createDemonCard(demon);
    container.appendChild(card);
  });

  setupMinusSearch();
  loadLeaderboardMinus(minusDemons);
}

/* ---------------------------------------------------
   SEARCH BAR (MAIN)
--------------------------------------------------- */
function setupSearchBar() {
  const searchBar = document.getElementById("search-bar");

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();

    document.querySelectorAll("#demon-container .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

/* ---------------------------------------------------
   SEARCH BAR (MINUS)
--------------------------------------------------- */
function setupMinusSearch() {
  const searchBar = document.getElementById("search-bar-minus");

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();

    document.querySelectorAll("#demon-container-minus .demon-card").forEach(card => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      card.style.display = name.includes(query) ? "flex" : "none";
    });
  });
}

/* ---------------------------------------------------
   YOUTUBE HELPERS
--------------------------------------------------- */
function getYoutubeThumbnail(url) {
  if (!url || typeof url !== "string") return null;

  try {
    let videoId = null;

    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v");
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }

    if (!videoId || videoId.length < 5) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

function extractVideoID(url) {
  try {
    if (url.includes("youtube.com/watch")) {
      return new URL(url).searchParams.get("v");
    }
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1].split("?")[0];
    }
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
  img.src = getYoutubeThumbnail(demon.verification) || "fallback.png";

  const info = document.createElement("div");
  info.className = "demon-info";

  const creatorsText = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : (demon.creators || "Unknown");

  const demonScore = demon.position <= 75
    ? (350 / Math.sqrt(demon.position))
    : 0;

  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  info.innerHTML = `
    <h2>${positionLabel} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${creatorsText}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>
  `;

  const viewBtn = document.createElement("button");
  viewBtn.className = "dropdown-btn";
  viewBtn.textContent = "View Demon Page";
  viewBtn.addEventListener("click", () => openDemonPage(demon));
  info.appendChild(viewBtn);

  const btn = document.createElement("button");
  btn.className = "dropdown-btn";
  btn.textContent = "Show Records";

  const dropdown = document.createElement("div");
  dropdown.className = "record-dropdown";

  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      const p = document.createElement("p");
      p.innerHTML = `
        <strong>${r.user}</strong> — ${r.percent}% (${r.hz}hz)
        ${r.link ? `<br><a href="${r.link}" target="_blank">Video</a>` : ""}
      `;
      dropdown.appendChild(p);
    });
  } else {
    dropdown.innerHTML = "<p>No records yet.</p>";
  }

  btn.addEventListener("click", () => {
    const visible = dropdown.style.display === "block";
    dropdown.style.display = visible ? "none" : "block";
    btn.textContent = visible ? "Show Records" : "Hide Records";
  });

  info.appendChild(btn);
  info.appendChild(dropdown);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

/* ---------------------------------------------------
   FULL DEMON PAGE
--------------------------------------------------- */
function openDemonPage(demon) {
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");

  const container = document.getElementById("demon-page-container");
  const positionLabel = demon.position > 75 ? "Legacy" : "#" + demon.position;

  const demonScore = demon.position <= 75
    ? (350 / Math.sqrt(demon.position))
    : 0;

  let recordsHTML = "";

  if (Array.isArray(demon.records) && demon.records.length > 0) {
    demon.records.forEach(r => {
      recordsHTML += `
        <div class="leaderboard-row">
          <span>${r.user}</span>
          <span>${r.percent}%</span>
          <span>${r.hz}hz</span>
          ${r.link ? `<a href="${r.link}" target="_blank">Video</a>` : ""}
        </div>
      `;
    });
  } else {
    recordsHTML = "<p>No records yet.</p>";
  }

  const videoId = extractVideoID(demon.verification);

  container.innerHTML = `
    <button class="dropdown-btn back-btn" onclick="goBackToList()">← Back to List</button>

    <h1>${positionLabel} — ${demon.name}</h1>

    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Creators:</strong> ${Array.isArray(demon.creators) ? demon.creators.join(", ") : (demon.creators || "Unknown")}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>Percent to Qualify:</strong> ${demon.percentToQualify}%</p>
    <p><strong>Score Value:</strong> ${demonScore.toFixed(2)}</p>

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
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demonlist").classList.add("active");
}

/* ---------------------------------------------------
   LEADERBOARD (MAIN)
--------------------------------------------------- */
function loadLeaderboard() {
  const players = {};

  globalDemons.forEach(demon => {
    const pos = demon.position;
    const demonScore = pos <= 75 ? 350 / Math.sqrt(pos) : 0;

    if (demon.verifier && demon.verifier !== "Not beaten yet") {
      const name = demon.verifier;

      if (!players[name]) {
        players[name] = { score: 0, records: [] };
      }

      players[name].score += demonScore;

      players[name].records.push({
        demon: demon.name,
        position: demon.position,
        percent: 100,
        link: demon.verification || null,
        type: "Verification"
      });
    }

    if (Array.isArray(demon.records)) {
      demon.records.forEach(rec => {

        if (rec.user === "Not beaten yet") return;

        const playerName = rec.user;
        const scoreGain = demonScore * (rec.percent / 100);

        if (!players[playerName]) {
          players[playerName] = { score: 0, records: [] };
        }

        players[playerName].score += scoreGain;

        players[playerName].records.push({
          demon: demon.name,
          position: demon.position,
          percent: rec.percent,
          link: rec.link,
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
    row.innerHTML = `
      <span>${i + 1}</span>
      <span class="clickable-player" data-player="${p.name}">${p.name}</span>
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
}

/* ---------------------------------------------------
   LEADERBOARD (MINUS)
--------------------------------------------------- */
function loadLeaderboardMinus(demons) {
  const players = {};

  demons.forEach(demon => {
    const demonScore = demon.position <= 75 ? 350 / Math.sqrt(demon.position) : 0;

    if (Array.isArray(demon.records)) {
      demon.records.forEach(rec => {

        if (rec.percent === 100 && rec.fromZero === true) {

          if (!players[rec.user]) {
            players[rec.user] = { score: 0, records: [] };
          }

          players[rec.user].score += demonScore;

          players[rec.user].records.push({
            demon: demon.name,
            position: demon.position,
            link: rec.link
          });
        }
      });
    }
  });

  const sorted = Object.entries(players)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);

  const container = document.getElementById("leaderboard-minus");
  container.innerHTML = "";

  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.innerHTML = `
      <span>${i + 1}</span>
      <span>${p.name}</span>
      <span>${p.score.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });
}

/* ---------------------------------------------------
   PLAYER PROFILE
--------------------------------------------------- */
function showPlayerProfile(name, playerData) {
  if (!playerData) return;

  document.querySelectorAll(".tab-content").
